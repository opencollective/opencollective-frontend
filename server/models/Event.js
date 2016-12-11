export default function(Sequelize, DataTypes) {

  const Event = Sequelize.define('Event', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    creatorId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    GroupId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Groups',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },

    maxAmount: {
      type: DataTypes.INTEGER, // In cents
      min: 0
    },

    quantity: {
      type: DataTypes.INTEGER
    },

    name: DataTypes.STRING,

    description: DataTypes.TEXT,

    locationString: DataTypes.STRING,

    slug: DataTypes.STRING,

    startsAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    endsAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

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
  });

  return Event;
}
