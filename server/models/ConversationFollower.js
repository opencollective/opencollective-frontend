import { sequelize } from '.';

export default function(Sequelize, DataTypes) {
  const ConversationFollower = Sequelize.define(
    'ConversationFollowers',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      UserId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Users' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      ConversationId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Conversations' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      // Using a dedicated column rather than deleting the follower in case the user is following
      // all the conversations for a Collective and wants to opt-out from one of them.
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
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
    },
    {
      indexes: [
        {
          fields: ['UserId', 'ConversationId'],
          unique: true,
        },
      ],
    },
  );

  // ---- Static methods ----

  /**
   * @returns true if user follows the conversation
   */
  ConversationFollower.isFollowing = async (UserId, ConversationId) => {
    const following = await ConversationFollower.findOne(
      { where: { UserId, ConversationId, isActive: true } },
      { mapToModel: false },
    );

    return Boolean(following);
  };

  /**
   * Creates or update the follower entry in the DB to follow the conversation
   *
   * @returns the `ConversationFollower` object.
   */
  ConversationFollower.follow = async (UserId, ConversationId) => {
    return sequelize.transaction(async transaction => {
      const following = await ConversationFollower.findOne({ where: { UserId, ConversationId } }, { transaction });
      if (!following) {
        return ConversationFollower.create({ UserId, ConversationId, isActive: true }, { transaction });
      } else if (!following.isActive) {
        return following.update({ isActive: true }, { transaction });
      } else {
        return following;
      }
    });
  };

  /**
   * Unfollow the conversation for user if it exists
   *
   * @returns the `ConversationFollower` object.
   */
  ConversationFollower.unfollow = async (UserId, ConversationId) => {
    return sequelize.transaction(async transaction => {
      const following = await ConversationFollower.findOne({ where: { UserId, ConversationId } }, { transaction });
      if (!following) {
        return ConversationFollower.create({ UserId, ConversationId, isActive: false }, { transaction });
      } else if (following.isActive) {
        return following.update({ isActive: false }, { transaction });
      } else {
        return following;
      }
    });
  };

  // ---- Prepare model ----

  ConversationFollower.associate = m => {
    ConversationFollower.belongsTo(m.User, {
      foreignKey: 'UserId',
      as: 'user',
    });

    ConversationFollower.belongsTo(m.Conversation, {
      foreignKey: 'ConversationId',
      as: 'conversation',
    });
  };

  ConversationFollower.schema('public');
  return ConversationFollower;
}
