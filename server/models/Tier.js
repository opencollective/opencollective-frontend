export default function(Sequelize, DataTypes) {

  const Tier = Sequelize.define('Tier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    EventId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Events',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: DataTypes.STRING,

    amount: {
      type: DataTypes.INTEGER, // In cents
      min: 0
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

    maxQuantity: {
      type: DataTypes.INTEGER,
      min: 0
    },

    password: {
      type: DataTypes.STRING
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

    instanceMethods: {
      availableQuantity() {
        return Sequelize.models.Response.sum('quantity', { 
            where: {
              TierId: this.id
            }
          })
          .then(usedQuantity => {
            if (this.maxQuantity && usedQuantity) {
              return this.maxQuantity - usedQuantity;
            } else if (this.maxQuantity) {
              return this.maxQuantity;
            } else {
              return -1; // means there was no maxQuantity set, so infinite availability
            }
          })
      },
      checkAvailableQuantity(quantityNeeded) {
        return this.availableQuantity()
        .then(available => ((available === -1) || (available - quantityNeeded >= 0)))
      }
    }
  });

  return Tier;
}
