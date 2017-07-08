import Promise from 'bluebird';
import { uniq } from 'lodash';
import _ from 'lodash';

export default function(Sequelize, DataTypes) {

  const { models } = Sequelize;

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

    // Max amount to raise across all tiers
    maxAmount: {
      type: DataTypes.INTEGER, // In cents
      min: 0
    },

    // Max quantity of tickets across all tiers
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
      unique: true,
      set(slug) {
        if (slug && slug.toLowerCase) {
          this.setDataValue('slug', slug.toLowerCase().replace(/ /g, '-').replace(/\./g, ''));
        }
      }
    },

    startsAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    endsAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    timezone: DataTypes.TEXT,

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

      location() {
        return {
          name: this.locationName,
          address: this.address,
          lat: this.geoLocationLatLong && this.geoLocationLatLong.coordinates[0],
          long: this.geoLocationLatLong && this.geoLocationLatLong.coordinates[1]
        }
      },

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
          timezone: this.timezone,
          status: this.status,
          confirmedAt: this.confirmedAt,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    },

    indexes: [
      {
        unique: true,
        fields: ['GroupId', 'slug']
      }
    ],

    instanceMethods: {
      getUsers() {
        return this.getResponses({ include: [{model: models.User }]})
          .then(rows => rows.map(r => r.User))
          .then(users => uniq(users, (user) => user.id));
      }
    },

    classMethods: {
      createMany: (events, defaultValues = {}) => {
        return Promise.map(events, e => Event.create(_.defaults({}, e, defaultValues)), {concurrency: 1});
      },
      getBySlug: (groupSlug, eventSlug) => {
        return Event.findOne({
          where: {
            slug: eventSlug
          },
          include: [{
            model: models.Group,
            where: {
              slug: groupSlug
            }
          }]
        })
        .then(ev => {
          if (!ev) {
            throw new Error(`No event found with slug: ${eventSlug} in collective: ${groupSlug}`)
          }
          return ev;
        })        
      }
    }
  });

  return Event;
}
