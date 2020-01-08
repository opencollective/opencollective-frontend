/**
 * Dependencies.
 */
import config from 'config';
import Temporal from 'sequelize-temporal';
import { Op } from 'sequelize';
import slugify from 'limax';
import Promise from 'bluebird';
import showdown from 'showdown';
import { defaults, pick } from 'lodash';

import * as errors from '../graphql/errors';
import activities from '../constants/activities';
import { sanitizeObject } from '../lib/utils';
import { mustHaveRole } from '../lib/auth';

import logger from '../lib/logger';

const markdownConverter = new showdown.Converter();

/**
 * Update Model.
 */
export default function(Sequelize, DataTypes) {
  const { models } = Sequelize;

  const Update = Sequelize.define(
    'Update',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        set(slug) {
          if (slug && slug.toLowerCase) {
            this.setDataValue(
              'slug',
              slug
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/\./g, ''),
            );
          }
        },
      },

      CollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      TierId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Tiers',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },

      FromCollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },

      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true, // non authenticated users can create a Update
      },

      LastEditedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true, // needs to be true because of old rows
      },

      title: {
        type: DataTypes.STRING,
        validate: {
          len: [1, 255],
        },
      },

      markdown: DataTypes.TEXT,
      html: {
        type: DataTypes.TEXT,
        get() {
          return this.getDataValue('markdown')
            ? markdownConverter.makeHtml(this.getDataValue('markdown'))
            : this.getDataValue('html');
        },
      },

      image: DataTypes.STRING,

      isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },

      publishedAt: {
        type: DataTypes.DATE,
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      deletedAt: {
        type: DataTypes.DATE,
      },

      makePublicOn: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
    },
    {
      paranoid: true,

      getterMethods: {
        // Info.
        info() {
          return {
            id: this.id,
            title: this.title,
            html: this.html,
            image: this.image,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            publishedAt: this.publishedAt,
            slug: this.slug,
            tags: this.tags,
          };
        },
        minimal() {
          return {
            id: this.id,
            publishedAt: this.publishedAt,
            title: this.title,
            image: this.image,
            slug: this.slug,
          };
        },
        activity() {
          return {
            id: this.id,
            slug: this.slug,
            title: this.title,
            CollectiveId: this.CollectiveId,
            FromCollectiveId: this.FromCollectiveId,
            TierId: this.TierId,
          };
        },
      },

      hooks: {
        beforeValidate: instance => {
          if (!instance.publishedAt || !instance.slug) {
            return instance.generateSlug();
          }
        },
        beforeUpdate: instance => {
          if (!instance.publishedAt || !instance.slug) {
            return instance.generateSlug();
          }
        },
        afterCreate: instance => {
          models.Activity.create({
            type: activities.COLLECTIVE_UPDATE_CREATED,
            UserId: instance.LastEditedByUserId,
            CollectiveId: instance.CollectiveId,
            data: {
              update: instance.activity,
            },
          });
        },
      },
    },
  );

  Update.schema('public');

  /**
   * Instance Methods
   */

  // Edit an update
  Update.prototype.edit = async function(remoteUser, newUpdateData) {
    mustHaveRole(remoteUser, 'ADMIN', this.CollectiveId, 'edit this update');
    if (newUpdateData.TierId) {
      const tier = await models.Tier.findByPk(newUpdateData.TierId);
      if (!tier) {
        throw new errors.ValidationFailed({ message: 'Tier not found' });
      }
      if (tier.CollectiveId !== this.CollectiveId) {
        throw new errors.ValidationFailed({
          message: "Cannot link this update to a Tier that doesn't belong to this collective",
        });
      }
    }
    const editableAttributes = [
      'TierId',
      'FromCollectiveId',
      'title',
      'html',
      'markdown',
      'image',
      'tags',
      'isPrivate',
      'makePublicOn',
    ];
    sanitizeObject(newUpdateData, ['html', 'markdown']);
    return await this.update({
      ...pick(newUpdateData, editableAttributes),
      LastEditedByUserId: remoteUser.id,
    });
  };

  // Publish update
  Update.prototype.publish = async function(remoteUser) {
    mustHaveRole(remoteUser, 'ADMIN', this.CollectiveId, 'publish this update');
    this.publishedAt = new Date();
    this.collective = this.collective || (await models.Collective.findByPk(this.CollectiveId));
    models.Activity.create({
      type: activities.COLLECTIVE_UPDATE_PUBLISHED,
      UserId: remoteUser.id,
      CollectiveId: this.CollectiveId,
      data: {
        collective: this.collective.activity,
        update: this.activity,
        url: `${config.host.website}/${this.collective.slug}/updates/${this.slug}`,
      },
    });
    return await this.save();
  };

  // Unpublish update
  Update.prototype.unpublish = async function(remoteUser) {
    mustHaveRole(remoteUser, 'ADMIN', this.CollectiveId, 'unpublish this update');
    this.publishedAt = null;
    return await this.save();
  };

  Update.prototype.delete = async function(remoteUser) {
    mustHaveRole(remoteUser, 'ADMIN', this.CollectiveId, 'delete this update');
    return this.destroy();
  };

  // Returns the User model of the User that created this Update
  Update.prototype.getUser = function() {
    return models.User.findByPk(this.CreatedByUserId);
  };

  /*
   * If there is a username suggested, we'll check that it's valid or increase it's count
   * Otherwise, we'll suggest something.
   */
  Update.prototype.generateSlug = function() {
    if (!this.title) {
      return;
    }
    const suggestion = slugify(this.title.trim()).toLowerCase(/\./g, '');

    /*
     * Checks a given slug in a list and if found, increments count and recursively checks again
     */
    const slugSuggestionHelper = (slugToCheck, slugList, count) => {
      const slug = count > 0 ? `${slugToCheck}${count}` : slugToCheck;
      if (slugList.indexOf(slug) === -1) {
        return slug;
      } else {
        return slugSuggestionHelper(`${slugToCheck}`, slugList, count + 1);
      }
    };

    // fetch any matching slugs or slugs for the top choice in the list above
    return Sequelize.query(
      `
        SELECT slug FROM "Updates" WHERE "CollectiveId"=${this.CollectiveId} AND slug like '${suggestion}%'
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    )
      .then(updateObjectList => updateObjectList.map(update => update.slug))
      .then(slugList => slugSuggestionHelper(suggestion, slugList, 0))
      .then(slug => {
        if (!slug) {
          return Promise.reject(new Error("We couldn't generate a unique slug for this Update"));
        }
        this.slug = slug;
      });
  };

  Update.makeUpdatesPublic = function() {
    const today = new Date().setUTCHours(0, 0, 0, 0);
    return models.Update.update(
      {
        isPrivate: false,
      },
      {
        where: {
          isPrivate: true,
          makePublicOn: { [Op.lte]: today },
        },
      },
    ).then(([affectedCount]) => {
      logger.info(`Number of private updates made public: ${affectedCount}`);
    });
  };

  Update.createMany = (updates, defaultValues) => {
    return Promise.map(updates, u => Update.create(defaults({}, u, defaultValues)), { concurrency: 1 }).catch(
      console.error,
    );
  };

  Update.findBySlug = (slug, options = {}) => {
    if (!slug || slug.length < 1) {
      return Promise.resolve(null);
    }
    return Update.findOne({
      where: { slug: slug.toLowerCase() },
      ...options,
    }).then(Update => {
      if (!Update) {
        throw new Error(`No update found with slug ${slug}`);
      }
      return Update;
    });
  };

  Update.associate = m => {
    Update.belongsTo(m.Collective, {
      foreignKey: 'CollectiveId',
      as: 'collective',
    });
    Update.belongsTo(m.Collective, {
      foreignKey: 'FromCollectiveId',
      as: 'fromCollective',
    });
    Update.belongsTo(m.Tier, { foreignKey: 'TierId', as: 'tier' });
    Update.belongsTo(m.User, { foreignKey: 'LastEditedByUserId', as: 'user' });
  };

  Temporal(Update, Sequelize);

  return Update;
}
