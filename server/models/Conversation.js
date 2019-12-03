import { stripHTML, generateSummaryForHTML } from '../lib/sanitize-html';

export default function(Sequelize, DataTypes) {
  const Conversation = Sequelize.define(
    'Conversation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
    { paranoid: true },
  );

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
