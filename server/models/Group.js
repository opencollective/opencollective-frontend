/**
 * Dependencies.
 */
import _ from 'lodash';
import Joi from 'joi';
import Temporal from 'sequelize-temporal';
import config from 'config';
import deepmerge from 'deepmerge';
import queries from '../lib/queries';
import groupBy from 'lodash/collection/groupBy';
import roles from '../constants/roles';
import {HOST_FEE_PERCENT} from '../constants/transactions';
import {getTier, isBackerActive, capitalize, pluralize } from '../lib/utils';
import activities from '../constants/activities';
import Promise from 'bluebird';

const DEFAULT_LOGO = '/public/images/1px.png';
const DEFAULT_BACKGROUND_IMG = `${config.host.website}/public/images/collectives/default-header-bg.jpg`;

const getDefaultSettings = (group) => {
  return {
    style: {
      hero: { 
        cover: { 
          transform: "scale(1.06)",
          backgroundImage: `url(${group.backgroundImage || DEFAULT_BACKGROUND_IMG})`
        }, 
        a: {}
      }
    }    
  }
};

const tier = Joi.object().keys({
  name: Joi.string().required(), // lowercase, act as a slug. E.g. "donors", "sponsors", "backers", "members", ...
  title: Joi.string(), // e.g. "Sponsors"
  description: Joi.string(), // what do people get as a member of this tier?
  button: Joi.string(), // Call To Action, e.g. "Become a sponsor"
  range: Joi.array().items(Joi.number().integer()).length(2).required(), // e.g. [100, 10000000]: Need to donate at least $100/interval to be a sponsor
  presets: Joi.array().items(Joi.number().integer()), // e.g. [1, 5, 20] for presets of $1, $5 and $20
  interval: Joi.string().valid(['monthly', 'yearly', 'one-time']).required(),
  amount: Joi.number()
}).unknown(); // this keeps unknown fields in the returned objects

const tiers = Joi.array().items(tier);

/**
 * Model.
 */
export default function(Sequelize, DataTypes) {

  const { models } = Sequelize;

  const Group = Sequelize.define('Group', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    mission: {
      type: DataTypes.STRING(100),
      get() {
        return (this.getDataValue('mission') || '').trim();
      }
    },

    description: DataTypes.STRING, // max 95 characters

    longDescription: DataTypes.TEXT,
    whyJoin: DataTypes.TEXT,

    // We should update those two fields periodically (but no need to be real time)
    budget: DataTypes.INTEGER, // yearly budget in cents
    burnrate: DataTypes.INTEGER, // monthly burnrate (last 3 months average, in cents)

    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },

    logo: {
      type: DataTypes.STRING,
      get() {
        return this.getDataValue('logo') || `${config.host.website}${DEFAULT_LOGO}`;
      }
    },

    video: DataTypes.STRING,

    image: DataTypes.STRING,
    backgroundImage: {
      type: DataTypes.STRING,
      get() {
        return this.getDataValue('backgroundImage');
      }
    },

    expensePolicy: DataTypes.TEXT,

    tiers: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        schema: (value) => {
          Joi.validate(value, tiers, (err) => {
            if (err) throw new Error(err.details[0].message);
          })
        }
      }
    },

    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        return deepmerge(getDefaultSettings(this), this.getDataValue('settings') || {});
      }
    },

    data: {
      type: DataTypes.JSON,
      allowNull: true
    },

    hostFeePercent: {
      type: DataTypes.FLOAT,
      defaultValue: HOST_FEE_PERCENT
    },

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

    slug: {
      type: DataTypes.STRING,
      unique: true,
      set(slug) {
        if (slug && slug.toLowerCase) {
          this.setDataValue('slug', slug.toLowerCase().replace(/ /g, '-').replace(/\./g, ''));
        }
      }
    },

    twitterHandle: {
      type: DataTypes.STRING, // without the @ symbol. Ex: 'asood123'
      set(twitterHandle) {
        this.setDataValue('twitterHandle', twitterHandle.replace(/^@/,''));
      }
    },

    website: DataTypes.STRING,

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
    },

    lastEditedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true // needs to be true because of old rows
    }
  }, {
    paranoid: true,

    getterMethods: {
      // Info.
      info() {
        return {
          id: this.id,
          name: this.name,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          whyJoin: this.whyJoin,
          budget: this.budget,
          burnrate: this.burnrate,
          currency: this.currency,
          logo: this.logo,
          video: this.video,
          image: this.image,
          data: this.data,
          backgroundImage: this.backgroundImage,
          expensePolicy: this.expensePolicy,
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
          isSupercollective: this.isSupercollective
        };
      },
      card() {
        return {
          id: this.id,
          createdAt: this.createdAt,
          name: this.name,
          slug: this.slug,
          logo: this.logo,
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
          logo: this.logo,
          slug: this.slug,
          publicUrl: this.publicUrl,
          mission: this.mission,
          isSupercollective: this.isSupercollective
        }
      }
    },

    instanceMethods: {
      getHost() {
        return models.User.findOne({
          include: [
            { model: models.UserGroup, where: { role: roles.HOST, GroupId: this.id } }
          ]
        });
      },

      getUsersForViewer(viewer) {
        const promises = [queries.getUsersFromGroupWithTotalDonations(this.id)];
        if (viewer) {
          promises.push(viewer.canEditGroup(this.id));
        }
        return Promise.all(promises)
        .then(results => results[0].map(user => results[1] ? user.info : user.public))
      },

      getSuperCollectiveGroupsIds() {
        if (!this.isSupercollective) return Promise.resolve([this.id]);
        if (this.superCollectiveGroupsIds) return Promise.resolve(this.superCollectiveGroupsIds);
        return models.Group.findAll({
          attributes: ['id'],
          where: {
            tags: { $contains: [this.settings.superCollectiveTag] }
          }
        })
        .then(rows => rows.map(r => r.id))
        .then(ids => {
          ids.push(this.id);
          this.superCollectiveGroupsIds = ids;
          return ids;
        });
      },

      /**
       * returns the tiers with their users
       * e.g. group.tiers = [
       *  { name: 'core contributor', users: [ {UserObject} ], range: [], ... },
       *  { name: 'backer', users: [ {UserObject}, {UserObject} ], range: [], ... }
       * ]
       */
      getTiersWithUsers(options = { active: false, attributes: ['id','username', 'avatar','firstDonation', 'lastDonation','totalDonations','website'] }) {
        const tiers = _.clone(this.tiers);
        return queries.getUsersFromGroupWithTotalDonations(this.id, options.until)
          .then(users => {
            if (!tiers) return [ { name: 'backer', title: 'Backers', range: [0, Infinity], users: users.map(u => _.pick(u,options.attributes)) } ];
            const tierIndex = {};
            tiers.map((tier, index) => {
              tierIndex[tier.name] = index;
              tiers[index].title = tier.title || capitalize(pluralize(tier.name));
              tiers[index].users = [];
            });
            users.map(user => {
              user.tier = getTier(user, tiers);
              user.avatar = user.avatar || `/public/images/users/avatar-02.svg`;
              if (tierIndex[user.tier] === undefined) {
                tierIndex[user.tier] = tiers.length;
                tiers.push({ name: user.tier, title: capitalize(pluralize(user.tier)), users: [], range: [0, Infinity] });
              }
              if (!options.active || isBackerActive(user, tiers))
                tiers[tierIndex[user.tier]].users.push(_.pick(user,options.attributes));
            });
            return tiers;
          });
      },

      hasUserWithRole(userId, expectedRoles, cb) {
        this
          .getUsers({
            where: {
              id: userId
            }
          })
          .then(users => users.map(user => user.UserGroup.role))
          .tap(actualRoles => cb(null, _.intersection(expectedRoles, actualRoles).length > 0))
          .catch(cb);
      },

      addUserWithRole(user, role) {
        const lists = {};
        lists[roles.BACKER] = 'backers';
        lists[roles.MEMBER] = 'members';
        lists[roles.HOST] = 'host';

        const notifications = [{type:`mailinglist.${lists[role]}`}];

        switch (role) {
          case roles.HOST:
            notifications.push({type:activities.GROUP_TRANSACTION_CREATED});
            notifications.push({type:activities.GROUP_EXPENSE_CREATED});
            break;
          case roles.MEMBER:
            notifications.push({type:activities.GROUP_EXPENSE_CREATED});
            notifications.push({type:'group.monthlyreport'});
            break;
        }

        return Promise.all([
          Sequelize.models.UserGroup.create({ role, UserId: user.id, GroupId: this.id }),
          Sequelize.models.Notification.createMany(notifications, { UserId: user.id, GroupId: this.id, channel: 'email' })
        ]);
      },

      findOrAddUserWithRole(user, role) {
        return Sequelize.models.UserGroup.find({
          where: {
            role,
            UserId: user.id,
            GroupId: this.id
          }})
        .then(userGroup => {
          if (!userGroup) {
            return this.addUserWithRole(user, role)
          } else {
            return userGroup;
          }
        });
      },

      getStripeAccount() {
        return Sequelize.models.UserGroup.find({
          where: {
            GroupId: this.id,
            role: roles.HOST
          }
        })
        .then((userGroup) => {
          if (!userGroup) {
            return { stripeAccount: null };
          }

          return Sequelize.models.User.find({
            where: {
              id: userGroup.UserId
            },
            include: [{
              model: Sequelize.models.StripeAccount
            }]
          });
        })
        .then((user) => user.StripeAccount);
      },

      getConnectedAccount() {

        return models.UserGroup.find({
          where: {
            GroupId: this.id,
            role: roles.HOST
          }
        })
        .then((userGroup) => {
          if (!userGroup) {
            return null;
          }

          return models.ConnectedAccount.find({
            where: {
              UserId: userGroup.UserId,
              provider: 'paypal',
            }
          });
        });
      },

      getExpenses(status, startDate, endDate) {
        endDate = endDate || new Date;
        const where = {
          amount: { $lt: 0 },
          createdAt: { $lt: endDate },
          GroupId: this.id
        };
        if (status) where.status = status;
        if (startDate) where.createdAt.$gte = startDate;

        return models.Transaction.findAll({ where, order: [['createdAt','DESC']] });
      },

      getBalance(until) {
        until = until || new Date();
        return models.Transaction.find({
          attributes: [
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('netAmountInGroupCurrency')), 0), 'total']
          ],
          where: {
            GroupId: this.id,
            createdAt: { $lt: until }
          }
        })
        .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
      },

      getYearlyIncome() {
        /*
          Three cases:
          1) All active monthly subscriptions. Multiply by 12
          2) All one-time and yearly subscriptions
          3) All inactive monthly subscriptions that have contributed in the past
        */
        return Sequelize.query(`
          WITH "activeMonthlySubscriptions" as (
            SELECT DISTINCT d."SubscriptionId", t."netAmountInGroupCurrency"
            FROM "Transactions" t
            LEFT JOIN "Donations" d ON d.id = t."DonationId"
            LEFT JOIN "Subscriptions" s ON s.id = d."SubscriptionId"
            WHERE t."GroupId"=:GroupId
              AND s."isActive" IS TRUE
              AND s.interval = 'month'
              AND s."deletedAt" IS NULL
          )
          SELECT
            (SELECT
              COALESCE(SUM("netAmountInGroupCurrency"*12),0) FROM "activeMonthlySubscriptions")
            +
            (SELECT
              COALESCE(SUM(t."netAmountInGroupCurrency"),0) FROM "Transactions" t
              LEFT JOIN "Donations" d ON t."DonationId" = d.id
              LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
              WHERE t."GroupId" = :GroupId
                AND t.amount > 0
                AND t."deletedAt" IS NULL
                AND t."createdAt" > (current_date - INTERVAL '12 months')
                AND ((s.interval = 'year' AND s."isActive" IS TRUE AND s."deletedAt" IS NULL) OR s.interval IS NULL))
            +
            (SELECT
              COALESCE(SUM(t."netAmountInGroupCurrency"),0) FROM "Transactions" t
              LEFT JOIN "Donations" d ON t."DonationId" = d.id
              LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
              WHERE t."GroupId" = :GroupId
                AND t.amount > 0
                AND t."deletedAt" IS NULL
                AND t."createdAt" > (current_date - INTERVAL '12 months')
                AND s.interval = 'month' AND s."isActive" IS FALSE AND s."deletedAt" IS NULL)
            "yearlyIncome"
          `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
          {
            replacements: { GroupId: this.id },
            type: Sequelize.QueryTypes.SELECT
          })
          .then(result => Promise.resolve(parseInt(result[0].yearlyIncome,10)));
      },


      getTotalDonations(startDate, endDate) {
        endDate = endDate || new Date;
        const where = {
          amount: { $gt: 0 },
          createdAt: { $lt: endDate },
          GroupId: this.id
        };
        if (startDate) where.createdAt.$gte = startDate;
        return models.Transaction.find({
          attributes: [
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amount')), 0), 'total']
          ],
          where
        })
        .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
      },

      getTotalTransactions(startDate, endDate, type) {
        endDate = endDate || new Date;
        const where = {
          createdAt: { $lt: endDate },
          GroupId: this.id
        };
        if (startDate) where.createdAt.$gte = startDate;
        if (type === 'donation') where.amount = { $gt: 0 };
        if (type === 'expense') where.amount = { $lt: 0 };
        return models.Transaction.find({
          attributes: [
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('netAmountInGroupCurrency')), 0), 'total']
          ],
          where
        })
        .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
      },

      getBackersCount(until) {
        until = until || new Date;

        return models.Transaction.find({
            attributes: [
              [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('UserId'))), 'backersCount']
            ],
            where: {
              GroupId: this.id,
              amount: {
                $gt: 0
              },
              createdAt: { $lt: until }
            }
          })
        .then((result) => {
          const json = result.toJSON();
          return Promise.resolve(Number(json.backersCount));
        });
      },

      getTwitterSettings() {
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

        return isThankDonationEnabled(this.id)
          .then(thankDonationEnabled => {
            settings.twitter.thankDonationEnabled = thankDonationEnabled;
            _.defaults(settings.twitter, defaults);
            return settings.twitter;
          });
      },

      getRelatedGroups(limit=3, minTotalDonationInCents=10000, orderBy, orderDir) {
        return Group.getGroupsSummaryByTag(this.tags, limit, [this.id], minTotalDonationInCents, true, orderBy, orderDir);
      },

      hasHost() {
        return this.getHost()
        .then(userGroup => Promise.resolve(!!userGroup));
      },

      getSuperCollectiveData() {
        if (this.isSupercollective &&
          this.settings.superCollectiveTag &&
          this.settings.superCollectiveTag.length > 0) {
          return Group.getGroupsSummaryByTag(this.settings.superCollectiveTag, 10000, [this.id], 0, false);
        }
        return Promise.resolve();
      }
    },

    classMethods: {
      createMany: (groups, defaultValues) => {
        return Promise.map(groups, u => Group.create(_.defaults({},u,defaultValues)), {concurrency: 1}).catch(console.error);
      },

      getGroupsSummaryByTag: (tags, limit=3, excludeList=[], minTotalDonationInCents, randomOrder, orderBy, orderDir, offset) => {
        return queries.getGroupsByTag(tags, limit, excludeList, minTotalDonationInCents, randomOrder, orderBy, orderDir, offset)
          .then(groups => {
            return Promise.all(groups.map(group => {
              const appendTier = backers => {
                backers = backers.map(backer => {
                  backer.tier = getTier(backer, group.tiers);
                  return backer;
                });
                return backers;
              };

              return Promise.all([
                  group.getYearlyIncome(),
                  queries.getUsersFromGroupWithTotalDonations(group.id)
                    .then(appendTier)
                ])
                .then(results => {
                  const groupInfo = group.card;
                  groupInfo.yearlyIncome = results[0];
                  const usersByRole = groupBy(results[1], 'role');
                  const backers = usersByRole[roles.BACKER] || [];
                  groupInfo.backersAndSponsorsCount = backers.length;
                  groupInfo.membersCount = (usersByRole[roles.MEMBER] || []).length;
                  groupInfo.sponsorsCount = backers.filter((b) => b.tier.match(/^sponsor/i)).length;
                  groupInfo.backersCount = groupInfo.backersAndSponsorsCount - groupInfo.sponsorsCount;
                  groupInfo.contributorsCount = (group.data && group.data.githubContributors) ? Object.keys(group.data.githubContributors).length : 0;
                  return groupInfo;
                });
            }));
          })
      }
    }
  });
  Temporal(Group, Sequelize);
  return Group;

  function isThankDonationEnabled(GroupId) {
    return models.Notification.findOne({where: {
      channel: 'twitter',
      type: activities.GROUP_TRANSACTION_CREATED,
      GroupId,
      active: true
    }}).then(n => !!n);
  }
}
