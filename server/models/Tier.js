import Promise from 'bluebird';
import _ from 'lodash';

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
      allowNull: true
    },

    // human readable way to uniquely access a tier for a given group or group/event combo
    slug: {
      type: DataTypes.STRING,
      set(slug) {
        if (slug && slug.toLowerCase) {
          this.setDataValue('slug', slug.toLowerCase().replace(/ /g, '-'));
        }
      }
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      set(name) {
        if (!this.getDataValue('slug')) {
          this.slug = name;
        }
        this.setDataValue('name', name);
      }
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

    getterMethods: {
      info() {
        return {
          id: this.id,
          EventId: this.EventId,
          name: this.name,
          description: this.description,
          amount: this.amount,
          currency: this.currency,
          maxQuantity: this.maxQuantity,
          startsAt: this.startsAt,
          endsAt: this.endsAt,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    },

    classMethods: {
      createMany: (tiers, defaultValues = {}) => {
        return Promise.map(tiers, t => Tier.create(_.defaults({}, t, defaultValues)), {concurrency: 1});
      }
    },

    instanceMethods: {
      availableQuantity() {
        return Sequelize.models.Response.sum('quantity', { 
            where: {
              TierId: this.id,
              confirmedAt: { $ne: null }
            }
          })
          .then(usedQuantity => {
            if (this.maxQuantity && usedQuantity) {
              return this.maxQuantity - usedQuantity;
            } else if (this.maxQuantity) {
              return this.maxQuantity;
            } else {
              return Infinity;
            }
          })
      },
      checkAvailableQuantity(quantityNeeded) {
        return this.availableQuantity()
        .then(available => (available - quantityNeeded >= 0))
      }
    }
  });

  return Tier;
}
