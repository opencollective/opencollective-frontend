export default function(Sequelize, DataTypes) {

  const Event = Sequelize.define('Event', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    createdByUserId: {
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

    maxQuantity: {
      type: DataTypes.INTEGER
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: DataTypes.TEXT,

    locationName: DataTypes.STRING,

    address: DataTypes.STRING,

    geoLocationLatLong: DataTypes.GEOMETRY('POINT'),

    backgroundImage: {
      type: DataTypes.STRING,
      get() {
        return this.getDataValue('backgroundImage');
      }
    },

    slug: {
      type: DataTypes.STRING,
      allowNull: false
    },

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

    getterMethods: {
      info() {
        return {
          id: this.id,
          createdByUserId: this.createdByUserId,
          GroupId: this.GroupId,
          currency: this.currency,
          maxAmount: this.maxAmount,
          maxQuantity: this.maxQuantity,
          name: this.name,
          description: this.description,
          locationName: this.locationName,
          address: this.address,
          geoLocationLatLong: this.geoLocationLatLong,
          backgroundImage: this.backgroundImage,
          slug: this.slug,
          startsAt: this.startsAt,
          endsAt: this.endsAt,
          status: this.status,
          confirmedAt: this.confirmedAt,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    }
  });

  return Event;
}
