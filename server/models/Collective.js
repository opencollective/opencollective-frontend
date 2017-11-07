/**
 * Dependencies.
 */
import _ from 'lodash';
import Temporal from 'sequelize-temporal';
import config from 'config';
import deepmerge from 'deepmerge';
import queries from '../lib/queries';
import { difference, uniq, pick } from 'lodash';
import { types } from '../constants/collectives';
import roles from '../constants/roles';
import { HOST_FEE_PERCENT } from '../constants/transactions';
import { capitalize } from '../lib/utils';
import slugify from 'slug';
import activities from '../constants/activities';
import Promise from 'bluebird';
import userlib from '../lib/userlib';
import CustomDataTypes from './DataTypes';
import emailLib from '../lib/email';
import debugLib from 'debug';
const debug = debugLib('collective');


/**
 * Collective Model.
 * 
 * There 3 types of collective at the moment
 * - Collective
 * - User: Collective with only one ADMIN
 * - Event: Time based collective with a parent collective
 */
export default function(Sequelize, DataTypes) {

  const { models } = Sequelize;

  const Collective = Sequelize.define('Collective', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    type: {
      type: DataTypes.STRING, // COLLECTIVE, USER, EVENT
      defaultValue: "COLLECTIVE"
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

    name: DataTypes.STRING,

    CreatedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true // non authenticated users can create a collective
    },

    LastEditedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true // needs to be true because of old rows
    },

    ParentCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    HostCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    hostFeePercent: {
      type: DataTypes.FLOAT,
      defaultValue: HOST_FEE_PERCENT
    },

    mission: DataTypes.STRING, // max 95 characters
    description: DataTypes.STRING, // max 95 characters

    longDescription: DataTypes.TEXT,

    currency: CustomDataTypes(DataTypes).currency,

    image: DataTypes.STRING,

    backgroundImage: {
      type: DataTypes.STRING,
      get() {
        return this.getDataValue('backgroundImage');
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

    locationName: DataTypes.STRING,

    address: DataTypes.STRING,

    geoLocationLatLong: DataTypes.GEOMETRY('POINT'),

    settings: {
      type: DataTypes.JSON,
    },

    data: {
      type: DataTypes.JSON,
      allowNull: true
    },

    startsAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    endsAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    timezone: DataTypes.STRING,

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    twitterHandle: {
      type: DataTypes.STRING, // without the @ symbol. Ex: 'asood123'
      set(twitterHandle) {
        if (typeof twitterHandle !== 'string') return;
        this.setDataValue('twitterHandle', twitterHandle.replace(/^@/,''));
      }
    },

    website: {
      type: DataTypes.STRING,
      get() {
        let website = this.getDataValue('website');
        if (website) {
          if (!website.match(/^http/i)) {
            website = `http://${website}`;
          }
          return website;
        }
        return (this.getDataValue('twitterHandle')) ? `https://twitter.com/${this.getDataValue('twitterHandle')}` : null;
      }
    },

    publicUrl: {
      type: new DataTypes.VIRTUAL(DataTypes.STRING, ['slug']),
      get() {
        return `${config.host.website}/${this.get('slug')}`;
      }
    },

    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING)
    },

    isSupercollective: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }

  }, {
    paranoid: true,

    getterMethods: {

      location() {
        return {
          name: this.locationName,
          address: this.address,
          lat: this.geoLocationLatLong && this.geoLocationLatLong.coordinates && this.geoLocationLatLong.coordinates[0],
          long: this.geoLocationLatLong && this.geoLocationLatLong.coordinates && this.geoLocationLatLong.coordinates[1]
        }
      },

      // Info.
      info() {
        return {
          id: this.id,
          name: this.name,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          currency: this.currency,
          image: this.image,
          data: this.data,
          backgroundImage: this.backgroundImage,
          maxAmount: this.maxAmount,
          maxQuantity: this.maxQuantity,
          locationName: this.locationName,
          address: this.address,
          geoLocationLatLong: this.geoLocationLatLong,
          startsAt: this.startsAt,
          endsAt: this.endsAt,
          timezone: this.timezone,
          status: this.status,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          isActive: this.isActive,
          slug: this.slug,
          tiers: this.tiers,
          settings: this.settings,
          website: this.website,
          twitterHandle: this.twitterHandle,
          publicUrl: this.publicUrl,
          hostFeePercent: this.hostFeePercent,
          tags: this.tags,
          HostCollectiveId: this.HostCollectiveId,
          isSupercollective: this.isSupercollective
        };
      },
      card() {
        return {
          id: this.id,
          createdAt: this.createdAt,
          name: this.name,
          slug: this.slug,
          image: this.image,
          backgroundImage: this.backgroundImage,
          publicUrl: this.publicUrl,
          mission: this.mission,
          settings: this.settings,
          currency: this.currency
        }
      },
      minimal() {
        return {
          id: this.id,
          name: this.name,
          image: this.image,
          slug: this.slug,
          twitterHandle: this.twitterHandle,
          publicUrl: this.publicUrl,
          mission: this.mission,
          isSupercollective: this.isSupercollective
        }
      }
    },

    hooks: {
      beforeCreate: (instance) => {
        if (instance.slug) return Promise.resolve();

        const potentialSlugs = [
          instance.slug,
          instance.image ? userlib.getUsernameFromGithubURL(instance.image) : null,
          instance.twitterHandle ? instance.twitterHandle.replace(/@/g, '') : null,
          instance.name ? instance.name.replace(/ /g, '-') : null
        ];
        return Collective.generateSlug(potentialSlugs)
          .then(slug => {
            if (!slug) {
              return Promise.reject(new Error(`We couldn't generate a unique slug for this collective`, potentialSlugs));
            }
            instance.slug = slug;
            return Promise.resolve();
          });

      },
      afterCreate: (instance) => {
        models.PaymentMethod.create({
          CollectiveId: instance.id,
          service: 'opencollective',
          name: `${capitalize(instance.name)} Collective`,
          primary: true,
          currency: instance.currency
        });
        return null;
      }
    }
  });

  /**
   * Instance Methods
   */
  Collective.prototype.getUser = function() {
    if ([ types.USER, types.ORGANIZATION ].includes(this.type)) {
      return models.User.findOne({ where: { CollectiveId: this.id } });
    } else {
      return Promise.resolve(null);
    }
  };

  Collective.prototype.getUsers = function() {
    return models.Member.findAll({
      where: { CollectiveId: this.id },
      include: [
        { model: models.Collective, as: 'memberCollective' }
      ]
    })
    .then(memberships => memberships.memberCollective)
    .map(memberCollective => memberCollective.getUser())
    .then(users => uniq(users, (user) => user.id));
  };

  Collective.prototype.getEvents = function(query = {}) {
    return Collective.findAll({
      ...query,
      where: {
        ...query.where,
        ParentCollectiveId: this.id,
        type: types.EVENT
      }
    });
  };

  /**
   * Return stats about backers
   *  - stats.backers.lastMonth: number of backers by endDate
   *  - stats.backers.previousMonth: number of backers by startDate
   *  - stats.backers.new: the number of backers whose first donation was after startDate
   */
  Collective.prototype.getBackersStats = function(startDate, endDate) {

    const getBackersUntil = (until) => models.Member.count({
      where: {
        CollectiveId: this.id,
        role: roles.BACKER,
        createdAt: { $lt: until }
      }
    });

    return Promise.all([
      getBackersUntil(startDate),
      getBackersUntil(endDate)
    ])
    .then(results => {
      return {
        backers: {
          lastMonth: results[1],
          previousMonth: results[0],
          new: results[1] - results[0]
        }
      }
    });
  }

  Collective.prototype.getIncomingOrders = function(options) {
    const query = deepmerge({
      where: { CollectiveId: this.id }
    }, options);
    return models.Order.findAll(query);
  };

  Collective.prototype.getRoleForMemberCollective = function(MemberCollectiveId) {
    if (!MemberCollectiveId) return null;
    return models.Member.findOne({
      where: { MemberCollectiveId, CollectiveId: this.id }
    }).then(member => member.role);
  };

  Collective.prototype.getSuperCollectiveCollectivesIds = function() {
    if (!this.isSupercollective) return Promise.resolve([this.id]);
    if (this.superCollectiveCollectivesIds) return Promise.resolve(this.superCollectiveCollectivesIds);
    return models.Collective.findAll({
      attributes: ['id'],
      where: {
        tags: { $contains: [this.settings.superCollectiveTag] }
      }
    })
    .then(rows => rows.map(r => r.id))
    .then(ids => {
      ids.push(this.id);
      this.superCollectiveCollectivesIds = ids;
      return ids;
    });
  };

  /**
   * returns the tiers with their users
   * e.g. collective.tiers = [
   *  { name: 'core contributor', users: [ {UserObject} ], range: [], ... },
   *  { name: 'backer', users: [ {UserObject}, {UserObject} ], range: [], ... }
   * ]
   */
  Collective.prototype.getTiersWithUsers = function(options = { active: false, attributes: ['id', 'username', 'image', 'firstDonation', 'lastDonation', 'totalDonations', 'website'] }) {
    const tiersById = {};
      // Get the list of tiers for the collective
    return models.Tier
      .findAll({ where: { CollectiveId: this.id, type: 'TIER' } })
      .then(tiers => tiers.map(t => {
        tiersById[t.id] = t;
      }))
      .then(() => queries.getBackersOfCollectiveWithTotalDonations(this.id, options))
      // Map the users to their respective tier
      .map(backerCollective => {
        const include = options.active ? [ { model: models.Subscription, attributes: ['isActive'] } ] : [];
        return models.Order.findOne({
          attributes: [ 'TierId' ],
          where: { FromCollectiveId: backerCollective.id, CollectiveId: this.id, TierId: { $ne: null } },
          include
        }).then(order => {
          if (!order) {
            debug("Collective.getTiersWithUsers: no order for a tier for ", { FromCollectiveId: backerCollective.id, CollectiveId: this.id });
            return null;
          }
          const TierId = order.TierId;
          tiersById[TierId] = tiersById[TierId] || order.Tier;
          tiersById[TierId].dataValues.users = tiersById[TierId].dataValues.users || [];
          if (options.active) {
            backerCollective.isActive = order.Subscription.isActive;
          }
          debug("adding to tier", TierId, "backer: ", backerCollective.dataValues.slug);
          tiersById[TierId].dataValues.users.push(backerCollective.dataValues);
        })
      })
      .then(() => {
        return Object.values(tiersById)
      });
  };

  /**
   * Get the Tier object of a user
   * @param {*} user 
   */
  Collective.prototype.getBackerTier = function(backerCollective) {
    if (backerCollective.role && backerCollective.role !== 'BACKER') return backerCollective;
    return models.Order.findOne({
      where: {
        FromCollectiveId: backerCollective.id,
        CollectiveId: this.id
      },
      include: [ { model: models.Tier, where: { type: 'TIER' } } ]
    }).then(order => order && order.Tier);
  };

  Collective.prototype.addUserWithRole = function(user, role, defaultAttributes) {
    const lists = {};
    lists[roles.BACKER] = 'backers';
    lists[roles.ADMIN] = 'admins';
    lists[roles.HOST] = 'host';

    const notifications = [ { type:`mailinglist.${lists[role]}` } ];

    switch (role) {
      case roles.HOST:
        notifications.push({ type:activities.COLLECTIVE_TRANSACTION_CREATED });
        notifications.push({ type:activities.COLLECTIVE_EXPENSE_CREATED });
        this.update({ HostCollectiveId: user.CollectiveId, ParentCollectiveId: this.ParentCollectiveId || user.CollectiveId });
        break;
      case roles.ADMIN:
        notifications.push({ type:activities.COLLECTIVE_EXPENSE_CREATED });
        notifications.push({ type:'collective.monthlyreport' });
        break;
    }

    const member = {
      role,
      CreatedByUserId: user.id,
      MemberCollectiveId: user.CollectiveId,
      CollectiveId: this.id,
      ... defaultAttributes
    };

    debug("addUserWithRole", user.id, role, "member", member);
    return Promise.all([
      models.Member.create(member),
      models.Notification.createMany(notifications, { UserId: user.id, CollectiveId: this.id, channel: 'email' }),
      models.User.findById(member.CreatedByUserId, { include: [ { model: models.Collective, as: 'collective' }] }),
      models.User.findById(user.id, { include: [ { model: models.Collective, as: 'collective' }] })
    ])
    .then(results => {
      const remoteUser = results[2];
      const recipient = results[3];
      emailLib.send('collective.newmember', recipient.email, {
        remoteUser: {
          email: remoteUser.email,
          collective: pick(remoteUser.collective, ['slug', 'name', 'image'])
        },
        role: role.toLowerCase(),
        isAdmin: role === roles.ADMIN,
        collective: {
          slug: this.slug,
          name: this.name,
          type: this.type.toLowerCase()
        },
        recipient: {
          collective: pick(recipient.collective, ['name', 'slug', 'website', 'twitterHandle', 'description', 'image'])
        },
        loginLink: results[3].generateLoginLink(`/${recipient.collective.slug}/edit`)
      }, { cc: remoteUser.email });
      return results[0];
    });
  };

  // Used when creating a transactin to add a user to the collective as a backer if needed
  Collective.prototype.findOrAddUserWithRole = function(user, role, defaultAttributes) {
    return models.Member.findOne({
      where: {
        role,
        CreatedByUserId: user.id,
        MemberCollectiveId: user.CollectiveId,
        CollectiveId: this.id
      }})
    .then(Member => {
      if (!Member) {
        return this.addUserWithRole(user, role, defaultAttributes)
      } else {
        return Member;
      }
    });
  };

  // edit the list of members and admins of this collective (create/update/remove)
  // creates a User and a UserCollective if needed
  Collective.prototype.editMembers = function(members, defaultAttributes = {}) {
    if (!members) return Promise.resolve();
    return this.getMembers({ where: { role: { $in: [ roles.ADMIN, roles.MEMBER ] } } } )
      .then(oldMembers => {
        // remove the members that are not present anymore
        const diff = difference(oldMembers.map(t => t.id), members.map(t => t.id));
        if (diff.length === 0) {
          return null;
        } else {
          debug("editMembers", "delete", diff);
          return models.Member.update({ deletedAt: new Date }, { where: { id: { $in: diff }}})
        }
      })
      .then(() => {
        return Promise.map(members, (member) => {
          if (member.id) {
            // Edit an existing membership (edit the role/description)
            const editableAttributes = pick(member, ['role', 'description']);
            debug("editMembers", "update member", member.id, editableAttributes);
            return models.Member.update(editableAttributes, { where: { id: member.id }});
          } else {
            // Create new membership
            member.CollectiveId = this.id;
            if (member.CreatedByUserId) {
              const user = {
                id: member.CreatedByUserId,
                CollectiveId: member.MemberCollectiveId
              };
              return this.addUserWithRole(user, member.role, { TierId: member.TierId, ...defaultAttributes });
            } else {
              return models.User.findOrCreateByEmail(member.member.email, member.member)
                .then(user => {
                  return this.addUserWithRole(user, member.role, { TierId: member.TierId, ...defaultAttributes });
                })
            }
          }
        });
      })
      .then(() => this.getMembers({ where: { role: { $in: [ roles.ADMIN, roles.MEMBER ] } } } ))
  };

  // edit the tiers of this collective (create/update/remove)
  Collective.prototype.editTiers = function(tiers) {
    if (!tiers) return this.getTiers();

    return this.getTiers()
    .then(oldTiers => {
      // remove the tiers that are not present anymore in the updated collective
      const diff = difference(oldTiers.map(t => t.id), tiers.map(t => t.id));
      return models.Tier.update({ deletedAt: new Date }, { where: { id: { $in: diff }}})
    })
    .then(() => {
      return Promise.map(tiers, (tier) => {
        if (tier.id) {
          return models.Tier.update(tier, { where: { id: tier.id }});
        } else {
          if (!tier.name) return;
          tier.CollectiveId = this.id;
          tier.currency = tier.currency || this.currency;
          return models.Tier.create(tier);  
        }
      });
    })
    .then(() => this.getTiers());
  };

  Collective.prototype.editPaymentMethods = function(paymentMethods, defaultAttributes = {}) {
    if (!paymentMethods) return Promise.resolve();
    return models.PaymentMethod.findAll({ where: { CollectiveId: this.id, archivedAt: { $eq: null } }})
    .then(oldPaymentMethods => {
      // remove the paymentMethods that are not present anymore in the updated collective
      const diff = difference(oldPaymentMethods.map(t => t.id), paymentMethods.map(t => t.id));
      return models.PaymentMethod.update({ archivedAt: new Date }, { where: { id: { $in: diff }}})
    })
    .then(() => {
      return Promise.map(paymentMethods, (pm) => {
        if (pm.id) {
          return models.PaymentMethod.update(pm, { where: { id: pm.id }});
        } else {
          pm.CollectiveId = this.id;
          pm.currency = pm.currency || this.currency;
          models.PaymentMethod.update({ primary: false }, { where: { CollectiveId: this.id, archivedAt: { $eq: null } }});
          return models.PaymentMethod.createFromStripeSourceToken({ ...defaultAttributes, ...pm });
        }
      });
    })
  };

  Collective.prototype.getExpenses = function(status, startDate, endDate = new Date) {
    const where = {
      createdAt: { $lt: endDate },
      CollectiveId: this.id
    };
    if (status) where.status = status;
    if (startDate) where.createdAt.$gte = startDate;

    return models.Expense.findAll({
      where,
      order: [['createdAt','DESC']]
    });
  };

  // Returns the last payment method that has been confirmed attached to this collective
  Collective.prototype.getPaymentMethod = async function(where) {
    return models.PaymentMethod.findOne({
      where: {
        ...where,
        CollectiveId: this.id,
        confirmedAt: { $ne: null }
      },
      order: [['confirmedAt', 'DESC']]
    })
    .tap(paymentMethod => {
      if (!paymentMethod) {
        throw new Error(`No payment method found`);
      } else if (paymentMethod.endDate && (paymentMethod.endDate < new Date())) {
        throw new Error('Payment method expired');
      }
    });    
  }

  Collective.prototype.getBalance = function(until) {
    until = until || new Date();
    return models.Transaction.find({
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('netAmountInCollectiveCurrency')), 0), 'total']
      ],
      where: {
        CollectiveId: this.id,
        createdAt: { $lt: until }
      }
    })
    .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
  };

  Collective.prototype.getYearlyIncome = function() {
    /*
      Three cases:
      1) All active monthly subscriptions. Multiply by 12
      2) All one-time and yearly subscriptions
      3) All inactive monthly subscriptions that have contributed in the past
    */
    return Sequelize.query(`
      WITH "activeMonthlySubscriptions" as (
        SELECT DISTINCT d."SubscriptionId", t."netAmountInCollectiveCurrency"
        FROM "Transactions" t
        LEFT JOIN "Orders" d ON d.id = t."OrderId"
        LEFT JOIN "Subscriptions" s ON s.id = d."SubscriptionId"
        WHERE t."CollectiveId"=:CollectiveId
          AND s."isActive" IS TRUE
          AND s.interval = 'month'
          AND s."deletedAt" IS NULL
      )
      SELECT
        (SELECT
          COALESCE(SUM("netAmountInCollectiveCurrency"*12),0) FROM "activeMonthlySubscriptions")
        +
        (SELECT
          COALESCE(SUM(t."netAmountInCollectiveCurrency"),0) FROM "Transactions" t
          LEFT JOIN "Orders" d ON t."OrderId" = d.id
          LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
          WHERE t."CollectiveId" = :CollectiveId
            AND t.type = 'CREDIT'
            AND t."deletedAt" IS NULL
            AND t."createdAt" > (current_date - INTERVAL '12 months')
            AND ((s.interval = 'year' AND s."isActive" IS TRUE AND s."deletedAt" IS NULL) OR s.interval IS NULL))
        +
        (SELECT
          COALESCE(SUM(t."netAmountInCollectiveCurrency"),0) FROM "Transactions" t
          LEFT JOIN "Orders" d ON t."OrderId" = d.id
          LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
          WHERE t."CollectiveId" = :CollectiveId
            AND t.type = 'CREDIT'
            AND t."deletedAt" IS NULL
            AND t."createdAt" > (current_date - INTERVAL '12 months')
            AND s.interval = 'month' AND s."isActive" IS FALSE AND s."deletedAt" IS NULL)
        "yearlyIncome"
      `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
      {
        replacements: { CollectiveId: this.id },
        type: Sequelize.QueryTypes.SELECT
      })
      .then(result => Promise.resolve(parseInt(result[0].yearlyIncome,10)));
  };

  Collective.prototype.getTotalAmountReceived = function(startDate, endDate) {
    endDate = endDate || new Date;
    const where = {
      amount: { $gt: 0 },
      createdAt: { $lt: endDate },
      CollectiveId: this.id
    };
    if (startDate) where.createdAt.$gte = startDate;
    return models.Transaction.find({
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amount')), 0), 'total']
      ],
      where
    })
    .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
  };

  // Get the total amount donated to other collectives
  Collective.prototype.getTotalAmountSent = function(startDate, endDate) {
    endDate = endDate || new Date;
    const where = {
      amount: { $gt: 0 },
      createdAt: { $lt: endDate },
      FromCollectiveId: this.id
    };
    if (startDate) where.createdAt.$gte = startDate;
    return models.Transaction.find({
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amount')), 0), 'total']
      ],
      where
    })
    .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
  };

  Collective.prototype.getTotalTransactions = function(startDate, endDate, type) {
    endDate = endDate || new Date;
    const where = {
      createdAt: { $lt: endDate },
      CollectiveId: this.id
    };
    if (startDate) where.createdAt.$gte = startDate;
    if (type === 'donation') where.amount = { $gt: 0 };
    if (type === 'expense') where.amount = { $lt: 0 };
    return models.Transaction.find({
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('netAmountInCollectiveCurrency')), 0), 'total']
      ],
      where
    })
    .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
  };

  Collective.prototype.getLatestDonations = function(since, until, tags) {
    tags = tags || [];
    return models.Transaction.findAll({
      where: {
        FromCollectiveId: this.id,
        createdAt: { $gte: since || 0, $lt: until || new Date}
      },
      order: [ ['amount','DESC'] ],
      include: [ { model: models.Collective, as: 'collective', where: { tags: { $contains: tags } } } ]
    });
  };

  /**
   * Get the total number of backers (individuals or organizations that have given money to the collective)
   * @params: { type, until }
   * type: COLLECTIVE/USER/ORGANIZATION or an array of types
   * until: date till when to count the number of backers
   */
  Collective.prototype.getBackersCount = function(options = {}) {

    const query = {
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('FromCollectiveId'))), 'count']
      ],
      where: {
        CollectiveId: this.id,
        FromCollectiveId: { $ne: this.HostCollectiveId },
        type: 'CREDIT'
      }
    };

    if (options.until) {
      query.where.createdAt = { $lt: options.until };
    }

    if (options.type) {
      const types = (typeof options.type === 'string') ? [options.type] : options.type;
      query.include = [
        {
          model: models.Collective,
          as: 'fromCollective',
          attributes: [],
          required: true,
          where: { type: { $in: types }}
        }
      ];
      query.raw = true; // need this otherwise it automatically also fetches Transaction.id which messes up everything
    }

    let promise;
    if (options.group) {
      query.attributes.push('fromCollective.type');
      query.include = [
        {
          model: models.Collective,
          as: 'fromCollective',
          attributes: [],
          required: true
        }
      ];
      query.raw = true; // need this otherwise it automatically also fetches Transaction.id which messes up everything
      query.group = options.group;
      promise = models.Transaction.findAll(query);
    } else {
      promise = models.Transaction.findOne(query);
    }

    return promise
    .then(res => {
      if (options.group) {
        const stats = { id: this.id };
        let all = 0;
        res.forEach(r => {
          stats[r.type] = r.count;
          all += r.count;
        })
        stats.all = all;
        debug("getBackersCount", stats);
        return stats;
      } else {
        // when it's a raw query, the result is not in dataValues
        const result = res.dataValues || res || {};
        debug("getBackersCount", result);
        if (!result.count) return 0;
        return Promise.resolve(Number(result.count));
      }
    });
  };

  Collective.prototype.getTwitterSettings = function() {
    const settings = this.settings || {};
    settings.twitter = settings.twitter || {};

    const defaults = {
      // thank you message immediately when receiving donation
      thankDonation: '$backer thanks for backing us!',

      // thank you message to all backers on 1st day of the month
      monthlyThankDonationsEnabled: false,
      monthlyThankDonationsSingular: 'Thank you $backer for supporting our collective',
      monthlyThankDonationsPlural: 'Thanks to our $backerCount backers and sponsors $backerList for supporting our collective'
    };

    const isThankDonationEnabled = (CollectiveId) => {
      return models.Notification.findOne({where: {
        channel: 'twitter',
        type: activities.COLLECTIVE_TRANSACTION_CREATED,
        CollectiveId,
        active: true
      }}).then(n => !!n);
    }

    return isThankDonationEnabled(this.id)
      .then(thankDonationEnabled => {
        settings.twitter.thankDonationEnabled = thankDonationEnabled;
        _.defaults(settings.twitter, defaults);
        return settings.twitter;
      });
  };

  Collective.prototype.getRelatedCollectives = function(limit=3, minTotalDonationInCents=10000, orderBy, orderDir) {
    return Collective.getCollectivesSummaryByTag(this.tags, limit, [this.id], minTotalDonationInCents, true, orderBy, orderDir);
  };

  // get the host of the parent collective if any, or of this collective
  Collective.prototype.getHostCollective = function() {
    if (this.HostCollectiveId) {
      return models.Collective.findById(this.HostCollectiveId);
    }
    return models.Member.findOne({
      attributes: ['MemberCollectiveId'],
      where: { role: roles.HOST, CollectiveId: this.ParentCollectiveId },
      include: [ { model: models.Collective, as: 'memberCollective' } ]
    }).then(m => m && m.memberCollective);
  };

  Collective.prototype.getHostCollectiveId = function() {
    if (this.HostCollectiveId) return Promise.resolve(this.HostCollectiveId);

    const where = { role: roles.HOST, CollectiveId: this.ParentCollectiveId || this.id };
    return models.Member.findOne({
      attributes: ['MemberCollectiveId'],
      where
    }).then(member => member && member.MemberCollectiveId);
  };

  Collective.prototype.getHostStripeAccount = function() {
    let HostCollectiveId;
    return this.getHostCollectiveId()
      .then(id => {
        HostCollectiveId = id
        debug("getHostStripeAccount for collective", this.slug, `(id: ${this.id})`, "HostCollectiveId", id);
        return id && models.ConnectedAccount.findOne({ where: { service: 'stripe', CollectiveId: id } });
      })
      .then(stripeAccount => {
        debug("getHostStripeAccount", "using stripe account", stripeAccount && stripeAccount.username);
        if (!stripeAccount || !stripeAccount.token) {
          return Promise.reject(new Error(`The host for the ${this.name} collective has no Stripe account set up (HostCollectiveId: ${HostCollectiveId})`));
        } else if (process.env.NODE_ENV !== 'production' && _.includes(stripeAccount.token, 'live')) {
          return Promise.reject(new Error(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
        } else {
          return stripeAccount;
        }
      });
  };

  Collective.prototype.setStripeAccount = function(stripeAccount) {
    if (!stripeAccount) return Promise.resolve(null);

    if (stripeAccount.id) {
      return models.ConnectedAccount.update({ CollectiveId: this.id }, { where: { id: stripeAccount.id }, limit: 1});
    } else {
      return models.ConnectedAccount.create({
        service: 'stripe',
        ...stripeAccount,
        CollectiveId: this.id
      });
    }
  };

  Collective.prototype.getSuperCollectiveData = function() {
    if (this.isSupercollective &&
      this.settings.superCollectiveTag &&
      this.settings.superCollectiveTag.length > 0) {
      return Collective.getCollectivesSummaryByTag(this.settings.superCollectiveTag, 10000, [this.id], 0, false);
    }
    return Promise.resolve();
  };
  
  /**
   * Class Methods
   */
  Collective.createOrganization = (collectiveData, adminUser) => {
    return Collective
      .create({
        ...collectiveData,
        type: types.ORGANIZATION,
        isActive: true,
        CreatedByUserId: adminUser.id
      })
      .tap(collective => {
        return models.Member.create({
          CreatedByUserId: adminUser.id,
          CollectiveId: collective.id,
          MemberCollectiveId: adminUser.CollectiveId,
          role: roles.ADMIN
        });
      });
  };

  Collective.createMany = (collectives, defaultValues) => {
    return Promise.map(collectives, u => Collective.create(_.defaults({},u,defaultValues)), {concurrency: 1}).catch(console.error);
  };

  Collective.getTopBackers = (since, until, tags, limit) => {
    return queries.getTopBackers(since || 0, until || new Date, tags, limit || 5)
      .tap(backers => debug("getTopBackers", backers.map(b => b.dataValues)));
  };

  /*
  * If there is a username suggested, we'll check that it's valid or increase it's count
  * Otherwise, we'll suggest something.
  */
  Collective.generateSlug = (suggestions) => {

    /*
    * Checks a given slug in a list and if found, increments count and recursively checks again
    */
    const slugSuggestionHelper = (slugToCheck, slugList, count) => {
      const slug = count > 0 ? `${slugToCheck}${count}` : slugToCheck;
      if (slugList.indexOf(slug) === -1) {
        return slug;
      } else {
        return slugSuggestionHelper(`${slugToCheck}`, slugList, count+1);
      }
    }

    suggestions = suggestions.filter(slug => slug ? true : false) // filter out any nulls
      .map(slug => slugify(slug.trim()).toLowerCase(/\./g,'')) // lowercase them all
      // remove any '+' signs
      .map(slug => slug.indexOf('+') !== -1 ? slug.substr(0, slug.indexOf('+')) : slug);

    // fetch any matching slugs or slugs for the top choice in the list above
    return Sequelize.query(`
        SELECT slug FROM "Collectives" where slug like '${suggestions[0]}%'
      `, {
        type: Sequelize.QueryTypes.SELECT
      })
    .then(userObjectList => userObjectList.map(user => user.slug))
    .then(slugList => slugSuggestionHelper(suggestions[0], slugList, 0));
  };

  Collective.findBySlug = (slug, options = {}) => {
    if (!slug || slug.length < 1) {
      return Promise.resolve(null);
    }
    return Collective.findOne({ where: { slug: slug.toLowerCase() }, ...options })
      .then(collective => {
        if (!collective) {
          throw new Error(`No collective found with slug ${slug}`)
        }
        return collective;
      })
  };

  Collective.getCollectivesSummaryByTag = (tags, limit=3, excludeList=[], minTotalDonationInCents, randomOrder, orderBy, orderDir, offset) => {
    debug("getCollectivesSummaryByTag", tags, limit, excludeList, minTotalDonationInCents, randomOrder, orderBy, orderDir, offset);
    return queries.getCollectivesByTag(tags, limit, excludeList, minTotalDonationInCents, randomOrder, orderBy, orderDir, offset)
      .then(collectives => {
        debug("getCollectivesSummaryByTag", collectives && collectives.length, "collectives found");
        return Promise.all(collectives.map(collective => {
          debug("getCollectivesSummaryByTag", "collective", collective.slug);
          return Promise.all([
              collective.getYearlyIncome(),
              queries
                .getBackersOfCollectiveWithTotalDonations(collective.id)
                .then(users => models.Tier.appendTier(collective, users))
            ])
            .then(results => {
              const usersByRole = {};
              const users = results[1];
              users.map(user => {
                usersByRole[user.dataValues.role] = usersByRole[user.dataValues.role] || [];
                usersByRole[user.dataValues.role].push(user);
              })
              const collectiveInfo = collective.card;
              collectiveInfo.yearlyIncome = results[0];
              const backers = usersByRole[roles.BACKER] || [];
              collectiveInfo.backersAndSponsorsCount = backers.length;
              collectiveInfo.membersCount = (usersByRole[roles.ADMIN] || []).length;
              collectiveInfo.sponsorsCount = backers.filter((b) => b.tier && b.tier.name.match(/sponsor/i)).length;
              collectiveInfo.backersCount = collectiveInfo.backersAndSponsorsCount - collectiveInfo.sponsorsCount;
              collectiveInfo.githubContributorsCount = (collective.data && collective.data.githubContributors) ? Object.keys(collective.data.githubContributors).length : 0;
              collectiveInfo.contributorsCount = collectiveInfo.membersCount + collectiveInfo.githubContributorsCount + collectiveInfo.backersAndSponsorsCount;
              return collectiveInfo;
            });
        }));
      })
  };

  Collective.associate = (m) => {
    Collective.hasMany(m.ConnectedAccount);
    Collective.belongsToMany(m.Collective, { through: { model: m.Member, unique: false, foreignKey: 'MemberCollectiveId' }, as: 'memberCollectives'});
    Collective.belongsToMany(m.Collective, { through: { model: m.Member, unique: false, foreignKey: 'CollectiveId' }, as: 'memberOfCollectives'});
    Collective.hasMany(m.Member);
    Collective.hasMany(m.Activity);
    Collective.hasMany(m.Notification);
    Collective.hasMany(m.Transaction, { foreignKey: 'CollectiveId', as: 'transactions' }); // collective.getTransactions()
    Collective.hasMany(m.Tier, { as: 'tiers' });    
  }

  Temporal(Collective, Sequelize);

  return Collective;

}
