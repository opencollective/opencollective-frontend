import Promise from 'bluebird';
import _ from 'lodash';
import debugLib from 'debug';
import slugify from 'limax';
import { Op } from 'sequelize';

import CustomDataTypes from './DataTypes';
import { maxInteger } from '../constants/math';
import { capitalize, pluralize, days, formatCurrency, strip_tags } from '../lib/utils';
import { isSupportedVideoProvider, supportedVideoProviders } from '../lib/validators';

const debug = debugLib('tier');

export default function(Sequelize, DataTypes) {
  const { models } = Sequelize;

  const Tier = Sequelize.define(
    'Tier',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      CollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      // human readable way to uniquely access a tier for a given collective or collective/event combo
      slug: {
        type: DataTypes.STRING,
        set(slug) {
          if (slug && slug.toLowerCase) {
            this.setDataValue('slug', slugify(slug));
          }
        },
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
        set(name) {
          if (!this.getDataValue('slug')) {
            this.slug = name;
          }
          this.setDataValue('name', name);
        },
        validate: {
          isValidName(value) {
            if (!value || value.trim().length === 0) {
              throw new Error('Name field is required for all tiers');
            }
          },
        },
      },

      type: {
        type: DataTypes.STRING, // TIER, TICKET, DONATION, SERVICE, PRODUCT, MEMBERSHIP
        defaultValue: 'TIER',
      },

      description: DataTypes.STRING,

      longDescription: {
        type: DataTypes.TEXT,
        validate: {
          // Max length for arround 1_000_000 characters ~4MB of text
          len: [0, 1000000],
        },
        set(content) {
          if (!content) {
            this.setDataValue('longDescription', null);
          } else {
            this.setDataValue('longDescription', strip_tags(content));
          }
        },
      },

      videoUrl: {
        type: DataTypes.STRING,
        validate: {
          isUrl: true,
          /** Ensure that the URL points toward a supported video provider */
          isSupportedProvider(url) {
            if (!url) {
              return;
            } else if (!isSupportedVideoProvider(url)) {
              throw new Error(
                `Only the following video providers are supported: ${supportedVideoProviders.join(', ')}`,
              );
            }
          },
        },
        set(url) {
          // Store null if URL is empty
          this.setDataValue('videoUrl', url || null);
        },
      },

      button: DataTypes.STRING,

      amount: {
        type: DataTypes.INTEGER, // In cents
        allowNull: true,
        validate: {
          min: 0,
          validateFixedAmount(value) {
            if (this.type !== 'TICKET' && this.amountType === 'FIXED' && (value === null || value === undefined)) {
              throw new Error(`In ${this.name}'s tier, "Amount" is required`);
            }
          },
          validateFlexibleAmount(value) {
            if (this.amountType === 'FLEXIBLE' && this.presets && this.presets.indexOf(value) === -1) {
              throw new Error(`In ${this.name}'s tier, "Default amount" must be one of suggested values amounts`);
            }
          },
        },
      },

      presets: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
      },

      amountType: {
        type: DataTypes.ENUM('FLEXIBLE', 'FIXED'),
        allowNull: false,
        defaultValue: 'FIXED',
      },

      minimumAmount: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
          isValidMinAmount(value) {
            const minPreset = this.presets ? Math.min(...this.presets) : null;
            if (this.amountType === 'FLEXIBLE' && value && minPreset < value) {
              throw new Error(`In ${this.name}'s tier, minimum amount cannot be less than minimum suggested amounts`);
            }
          },
        },
      },

      currency: CustomDataTypes(DataTypes).currency,

      interval: {
        type: DataTypes.STRING(8),
        validate: {
          isIn: {
            args: [['month', 'year']],
            msg: 'Must be month or year',
          },
        },
      },

      // Max quantity of tickets to sell (0 for unlimited)
      maxQuantity: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
        },
      },

      // Max quantity of tickets per user (0 for unlimited)
      maxQuantityPerUser: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
        },
      },

      // Goal to reach
      goal: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
        },
      },

      password: {
        type: DataTypes.STRING,
      },

      customFields: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },

      startsAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      endsAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
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
    },
    {
      paranoid: true,

      getterMethods: {
        info() {
          return {
            id: this.id,
            name: this.name,
            description: this.description,
            amount: this.amount,
            currency: this.currency,
            maxQuantity: this.maxQuantity,
            startsAt: this.startsAt,
            endsAt: this.endsAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
          };
        },

        minimal() {
          return {
            id: this.id,
            type: this.type,
            name: this.name,
          };
        },

        title() {
          return capitalize(pluralize(this.name));
        },

        amountStr() {
          let str;
          if (this.amountType === 'FLEXIBLE') {
            str = `${formatCurrency(this.minimumAmount || 0, this.currency)}+`;
          } else {
            str = `${formatCurrency(this.amount || 0, this.currency)}`;
          }

          if (this.interval) {
            str += ` per ${this.interval}`;
          }
          return str;
        },
      },
    },
  );

  /**
   * Instance Methods
   */

  /**
   * Check if a backer is active
   * True if there is an entry in the Members table for this Backer/Collective/Tier couple created before `until`
   * If this tier has an interval, returns true if the membership started within the month/year
   * or if the last transaction happened wihtin the month/year
   */
  Tier.prototype.isBackerActive = function(backerCollective, until = new Date()) {
    return models.Member.findOne({
      where: {
        CollectiveId: this.CollectiveId,
        MemberCollectiveId: backerCollective.id,
        TierId: this.id,
        createdAt: { [Op.lte]: until },
      },
    }).then(membership => {
      if (!membership) return false;
      if (!this.interval) return true;
      if (this.interval === 'month' && days(membership.createdAt, until) <= 31) return true;
      if (this.interval === 'year' && days(membership.createdAt, until) <= 365) return true;
      return models.Order.findOne({
        where: {
          CollectiveId: this.CollectiveId,
          FromCollectiveId: backerCollective.id,
          TierId: this.id,
        },
      }).then(order => {
        if (!order) return false;
        return models.Transaction.findOne({
          where: { OrderId: order.id, CollectiveId: this.CollectiveId },
          order: [['createdAt', 'DESC']],
        }).then(transaction => {
          if (!transaction) {
            debug('No transaction found for order', order.dataValues);
            return false;
          }
          if (this.interval === 'month' && days(transaction.createdAt, until) <= 31) return true;
          if (this.interval === 'year' && days(transaction.createdAt, until) <= 365) return true;
          return false;
        });
      });
    });
  };

  // TODO: Check for maxQuantityPerUser
  Tier.prototype.availableQuantity = function() {
    return models.Order.sum('quantity', {
      where: {
        TierId: this.id,
        processedAt: { [Op.ne]: null },
      },
    }).then(usedQuantity => {
      debug('availableQuantity', 'usedQuantity:', usedQuantity, 'maxQuantity', this.maxQuantity);
      if (this.maxQuantity && usedQuantity) {
        return this.maxQuantity - usedQuantity;
      } else if (this.maxQuantity) {
        return this.maxQuantity;
      } else {
        return maxInteger; // GraphQL doesn't like infinity
      }
    });
  };

  Tier.prototype.checkAvailableQuantity = function(quantityNeeded = 1) {
    return this.availableQuantity().then(available => available - quantityNeeded >= 0);
  };

  /**
   * Class Methods
   */
  Tier.createMany = (tiers, defaultValues = {}) => {
    return Promise.map(tiers, t => Tier.create(_.defaults({}, t, defaultValues)), { concurrency: 1 });
  };

  /**
   * Append tier to each backer in an array of backers
   */
  Tier.appendTier = (collective, backerCollectives) => {
    const backerCollectivesIds = backerCollectives.map(b => b.id);
    debug('appendTier', collective.name, 'backers: ', backerCollectives.length);
    return models.Member.findAll({
      where: {
        MemberCollectiveId: { [Op.in]: backerCollectivesIds },
        CollectiveId: collective.id,
      },
      include: [{ model: models.Tier }],
    }).then(memberships => {
      const membershipsForBackerCollective = {};
      memberships.map(m => {
        membershipsForBackerCollective[m.MemberCollectiveId] = m.Tier;
      });
      return backerCollectives.map(backerCollective => {
        backerCollective.tier = membershipsForBackerCollective[backerCollective.id];
        debug('appendTier for', backerCollective.name, ':', backerCollective.tier && backerCollective.tier.slug);
        return backerCollective;
      });
    });
  };

  return Tier;
}
