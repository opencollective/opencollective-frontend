/**
 * Dependencies.
 */
import _ from 'lodash';
import Temporal from 'sequelize-temporal';
import activities from '../constants/activities';
import Promise from 'bluebird';
import showdown from 'showdown';
const markdownConverter = new showdown.Converter();

import { buildSanitizerOptions, sanitizeHTML, stripHTML } from '../lib/sanitize-html';
import { sequelize } from '.';

// Options for sanitizing comment's body
const sanitizeOptions = buildSanitizerOptions({
  basicTextFormatting: true,
  multilineTextFormatting: true,
  links: true,
  images: true,
});

/**
 * Comment Model.
 */
export default function(Sequelize, DataTypes) {
  const { models } = Sequelize;

  const Comment = Sequelize.define(
    'Comment',
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
        allowNull: false,
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

      ExpenseId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Expenses',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },

      UpdateId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Updates',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },

      ConversationId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Conversations' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: true,
      },

      markdown: {
        type: DataTypes.TEXT,
        set(value) {
          if (value) {
            this.setDataValue('markdown', stripHTML(value));
          }
        },
      },

      html: {
        type: DataTypes.TEXT,
        set(value) {
          if (value) {
            const cleanHtml = sanitizeHTML(value, sanitizeOptions).trim();
            this.setDataValue('html', cleanHtml);
          }
        },
        get() {
          return this.getDataValue('html')
            ? this.getDataValue('html')
            : markdownConverter.makeHtml(this.getDataValue('markdown'));
        },
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
        // Info.
        info() {
          return {
            id: this.id,
            title: this.title,
            markdown: this.markdown,
            html: this.html,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
          };
        },
        minimal() {
          return {
            id: this.id,
            createdAt: this.createdAt,
          };
        },
        activity() {
          return {
            id: this.id,
            createdAt: this.createdAt,
          };
        },
      },

      hooks: {
        beforeCreate: instance => {
          if (!instance.ExpenseId && !instance.UpdateId && !instance.ConversationId) {
            throw new Error('Comment must be linked to an expense, an update or a conversation');
          }
        },
        afterCreate: instance => {
          models.Activity.create({
            type: activities.COLLECTIVE_COMMENT_CREATED,
            UserId: instance.CreatedByUserId,
            CollectiveId: instance.CollectiveId,
            data: {
              CommentId: instance.id,
              comment: {
                id: instance.id,
                html: instance.html,
              },
              FromCollectiveId: instance.FromCollectiveId,
              ExpenseId: instance.ExpenseId,
              UpdateId: instance.UpdateId,
              ConversationId: instance.ConversationId,
            },
          });
        },
      },
    },
  );

  Comment.schema('public');

  Comment.prototype._internalDestroy = Comment.prototype.destroy;
  Comment.prototype._internalUpdate = Comment.prototype.update;

  Comment.prototype.destroy = async function() {
    // If comment is the root comment of a conversation, we delete the conversation and all linked comments
    if (this.ConversationId) {
      const conversation = await models.Conversation.findOne({ where: { RootCommentId: this.id } });
      if (conversation) {
        await conversation.destroy();
        await models.Comment.destroy({ where: { ConversationId: conversation.id } });
        return this;
      }
    }

    return this._internalDestroy(...arguments);
  };

  Comment.prototype.update = async function(values, sequelizeOpts, ...args) {
    if (!this.ConversationId) {
      return this._internalUpdate(values, sequelizeOpts, ...args);
    }

    // If comment is the root comment of a conversation, we need tu update its summary
    const withTransaction = func =>
      sequelizeOpts && sequelizeOpts.transaction ? func(sequelizeOpts.transaction) : sequelize.transaction(func);

    return withTransaction(async transaction => {
      const conversation = await models.Conversation.findOne({ where: { RootCommentId: this.id } }, { transaction });
      if (conversation) {
        await conversation.update({ summary: values.html }, { transaction });
      }

      return this._internalUpdate(values, { ...sequelizeOpts, transaction }, ...args);
    });
  };

  // Returns the User model of the User that created this Update
  Comment.prototype.getUser = function() {
    return models.User.findByPk(this.CreatedByUserId);
  };

  Comment.createMany = (comments, defaultValues) => {
    return Promise.map(comments, u => Comment.create(_.defaults({}, u, defaultValues)), { concurrency: 1 }).catch(
      console.error,
    );
  };

  Comment.associate = m => {
    Comment.belongsTo(m.Collective, {
      foreignKey: 'CollectiveId',
      as: 'collective',
    });
    Comment.belongsTo(m.Collective, {
      foreignKey: 'FromCollectiveId',
      as: 'fromCollective',
    });
    Comment.belongsTo(m.Expense, { foreignKey: 'ExpenseId', as: 'expense' });
    Comment.belongsTo(m.Update, { foreignKey: 'UpdateId', as: 'update' });
    Comment.belongsTo(m.User, { foreignKey: 'CreatedByUserId', as: 'user' });
  };

  Temporal(Comment, Sequelize);

  return Comment;
}
