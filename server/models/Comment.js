/**
 * Dependencies.
 */
import _, { pick } from 'lodash';
import Temporal from 'sequelize-temporal';
import activities from '../constants/activities';
import { mustBeLoggedInTo } from '../lib/auth';
import Promise from 'bluebird';
import showdown from 'showdown';
const markdownConverter = new showdown.Converter();
import { sanitizeObject } from '../lib/utils';

import * as errors from '../graphql/errors';
/**
 * Comment Model.
 */
export default function(Sequelize, DataTypes) {

  const { models } = Sequelize;

  const Comment = Sequelize.define('Comment', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    FromCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true
    },

    CreatedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true // non authenticated users can create a Update
    },

    ExpenseId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Expenses',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true
    },

    UpdateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Updates',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true
    },

    markdown: DataTypes.TEXT,

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    
    deletedAt: {
      type: DataTypes.DATE
    }

  }, {
    paranoid: true,

    getterMethods: {

      html() {
        return this.getDataValue('markdown') ? markdownConverter.makeHtml(this.getDataValue('markdown')) : '';
      },

      // Info.
      info() {
        return {
          id: this.id,
          title: this.title,
          markdown: this.markdown,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      },
      minimal() {
        return {
          id: this.id,
          createdAt: this.createdAt
        }
      },
      activity() {
        return {
          id: this.id,
          createdAt: this.createdAt
        }
      }
    },

    hooks: {
      beforeCreate: (instance) => {
        if (!instance.ExpenseId && !instance.UpdateId) {
          throw new Error("Missing target expense or update");
        }
      },
      afterCreate: (instance) => {
        models.Activity.create({
          type: activities.COLLECTIVE_COMMENT_CREATED,
          UserId: instance.CreatedByUserId,
          CollectiveId: instance.CollectiveId,
          data: {
            CommentId: instance.id,
            FromCollectiveId: instance.FromCollectiveId,
            ExpenseId: instance.ExpenseId,
            UpdateId: instance.UpdateId
          }
        })
      }
    }
  });

  /**
   * Instance Methods
   */

  // Edit a comment
  Comment.prototype.edit = async function(remoteUser, newCommentData) {
    mustBeLoggedInTo(remoteUser, 'edit this comment');
    if (remoteUser.id !== this.CreatedByUserId || !remoteUser.isAdmin(this.CollectiveId)) {
      throw new errors.Unauthorized({ message: "You must be the author or an admin of this collective to edit this comment" });
    }
    const editableAttributes = ['FromCollectiveId', 'markdown'];
    sanitizeObject(newCommentData, ['markdown']);
    return await this.update({
      ...pick(newCommentData, editableAttributes)
    });
  }

  Comment.prototype.delete = async function(remoteUser) {
    mustBeLoggedInTo(remoteUser, "delete this comment");
    if (remoteUser.id !== this.CreatedByUserId || !remoteUser.isAdmin(this.CollectiveId)) {
      throw new errors.Unauthorized({ message: "You need to be logged in as a core contributor or as a host to delete this comment" });
    }
    return this.destroy();
  }

  // Returns the User model of the User that created this Update
  Comment.prototype.getUser = function() {
    return models.User.findById(this.CreatedByUserId);
  };

  Comment.createMany = (comments, defaultValues) => {
    return Promise.map(comments, u => Comment.create(_.defaults({}, u, defaultValues)), { concurrency: 1 }).catch(console.error);
  };

  Comment.associate = (m) => {
    Comment.belongsTo(m.Collective, { foreignKey: 'CollectiveId', as: 'collective' });
    Comment.belongsTo(m.Collective, { foreignKey: 'FromCollectiveId', as: 'fromCollective' });
    Comment.belongsTo(m.Expense, { foreignKey: 'ExpenseId', as: 'expense' });
    Comment.belongsTo(m.Update, { foreignKey: 'UpdateId', as: 'update' });
    Comment.belongsTo(m.User, { foreignKey: 'CreatedByUserId', as: 'user' });
  }

  Temporal(Comment, Sequelize);

  return Comment;

}
