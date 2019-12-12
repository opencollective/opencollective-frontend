import slugify from 'limax';

import { activities } from '../constants';
import { stripHTML, generateSummaryForHTML } from '../lib/sanitize-html';
import models, { sequelize } from '.';
import { idEncode, IDENTIFIER_TYPES } from '../graphql/v2/identifiers';

export default function(Sequelize, DataTypes) {
  const Conversation = Sequelize.define(
    'Conversation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hashId: {
        type: DataTypes.VIRTUAL(DataTypes.STRING),
        get() {
          return idEncode(this.get('id'), IDENTIFIER_TYPES.CONVERSATION);
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { len: [3, 255] },
        set(title) {
          if (title) {
            this.setDataValue('title', title.trim());
          }
        },
      },
      slug: {
        type: DataTypes.VIRTUAL(DataTypes.STRING),
        get() {
          return slugify(this.get('title')) || 'conversation';
        },
      },
      summary: {
        type: DataTypes.STRING,
        allowNull: false,
        set(summary) {
          this.setDataValue('summary', generateSummaryForHTML(summary, 240));
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        set(tags) {
          if (tags) {
            tags = tags
              .map(tag => {
                if (tag) {
                  const upperCase = tag.toUpperCase();
                  const cleanTag = upperCase.trim().replace(/\s+/g, ' ');
                  return stripHTML(cleanTag);
                }
              })
              .filter(tag => {
                return tag && tag.length > 0;
              });
          }

          if (!tags || tags.length === 0) {
            this.setDataValue('tags', null);
          } else if (tags) {
            this.setDataValue('tags', Array.from(new Set(tags)));
          }
        },
        validate: {
          validateTags(tags) {
            if (tags) {
              // Limit to max 30 tags
              if (tags.length > 30) {
                throw new Error(
                  `Conversations cannot have more than 30 tags. Please remove ${30 - tags.length} tag(s).`,
                );
              }

              // Validate each individual tags
              tags.forEach(tag => {
                if (tag.length === 0) {
                  throw new Error("Can't add empty tags");
                } else if (tag.length > 32) {
                  throw new Error(`Tag ${tag} is too long, must me shorter than 32 characters`);
                }
              });
            }
          },
        },
      },
      CollectiveId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Users' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      FromCollectiveId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      RootCommentId: {
        type: DataTypes.INTEGER,
      },
    },
    {
      paranoid: true,
    },
  );

  // ---- Static methods ----

  Conversation.createWithComment = async function(user, collective, title, html, tags = null) {
    // Use a transaction to make sure conversation is not created if comment creation fails
    const conversation = await sequelize.transaction(async t => {
      // Create conversation
      const conversation = await models.Conversation.create(
        {
          CreatedByUserId: user.id,
          CollectiveId: collective.id,
          FromCollectiveId: user.CollectiveId,
          title: title,
          tags: tags,
          summary: html,
        },
        { transaction: t },
      );

      // Create comment
      const comment = await models.Comment.create(
        {
          CollectiveId: collective.id,
          ConversationId: conversation.id,
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          html: html,
        },
        { transaction: t },
      );

      // Need to update the conversation to link a comment
      return conversation.update({ RootCommentId: comment.id }, { transaction: t });
    });

    // Create the activity asynchronously. We do it here rather than in a hook because
    // `afterCreate` doesn't wait the end of the transaction to run, see https://github.com/sequelize/sequelize/issues/8585
    models.Activity.create({
      type: activities.COLLECTIVE_CONVERSATION_CREATED,
      UserId: conversation.CreatedByUserId,
      CollectiveId: conversation.CollectiveId,
      data: {
        conversation: {
          id: conversation.id,
          hashId: conversation.hashId,
          slug: conversation.slug,
          title: conversation.title,
          summary: conversation.summary,
          tags: conversation.tags,
          FromCollectiveId: conversation.FromCollectiveId,
          CollectiveId: conversation.CollectiveId,
          RootCommentId: conversation.RootCommentId,
          CreatedByUserId: conversation.CreatedByUserId,
        },
      },
    });

    // Add user as a follower of the conversation
    await models.ConversationFollower.follow(user.id, conversation.id);
    return conversation;
  };

  Conversation.getMostPopularTagsForCollective = async function(collectiveId, limit = 100) {
    return Sequelize.query(
      `
      SELECT UNNEST(tags) AS id, UNNEST(tags) AS tag, COUNT(id)
      FROM "Conversations"
      WHERE "CollectiveId" = $collectiveId
      GROUP BY UNNEST(tags)
      ORDER BY count DESC
      LIMIT $limit
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
        bind: { collectiveId, limit },
      },
    );
  };

  // ---- Instance methods ----

  /**
   * Get a list of users who should be notified for conversation updates:
   * - Collective admins who haven't unsubscribed from the conversation
   * - Conversation followers
   */
  Conversation.prototype.getUsersFollowing = async function() {
    const followers = await models.ConversationFollower.findAll({
      include: ['user'],
      where: { ConversationId: this.id, isActive: true },
    });

    return followers.map(f => f.user);
  };

  // ---- Prepare model ----

  Conversation.associate = m => {
    Conversation.belongsTo(m.Collective, {
      foreignKey: 'CollectiveId',
      as: 'collective',
    });
    Conversation.belongsTo(m.Collective, {
      foreignKey: 'FromCollectiveId',
      as: 'fromCollective',
    });
  };

  Conversation.schema('public');
  return Conversation;
}
