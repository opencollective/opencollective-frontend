/**
 * Dependencies.
 */
import _ from 'lodash';
import Joi from 'joi';
import config from 'config';
import errors from '../lib/errors';
import queries from '../lib/queries';
import groupBy from 'lodash/collection/groupBy';
import filter from 'lodash/collection/filter';
import values from 'lodash/object/values';

import roles from '../constants/roles';
import {HOST_FEE_PERCENT} from '../constants/transactions';
import {getTier} from '../lib/utils';

const tier = Joi.object().keys({
  name: Joi.string().required(), // lowercase, act as a slug. E.g. "donors", "sponsors", "backers", "members", ...
  title: Joi.string().required(), // e.g. "Sponsors"
  description: Joi.string().required(), // what do people get as a member of this tier?
  button: Joi.string().required(), // Call To Action, e.g. "Become a sponsor"
  range: Joi.array().items(Joi.number().integer()).length(2).required(), // e.g. [100, 10000000]: Need to donate at least $100/interval to be a sponsor
  presets: Joi.array().items(Joi.number().integer()), // e.g. [1, 5, 20] for presets of $1, $5 and $20
  interval: Joi.string().valid(['monthly', 'yearly', 'one-time']).required()
});

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

    mission: DataTypes.STRING(100),

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

    logo: DataTypes.STRING,

    video: DataTypes.STRING,

    image: DataTypes.STRING,
    backgroundImage: DataTypes.STRING,

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
      allowNull: true
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

    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    slug: {
      type: DataTypes.STRING,
      unique: true,
      set(slug) {
        if (slug && slug.toLowerCase) {
          this.setDataValue('slug', slug.toLowerCase());
        }
      }
    },

    twitterHandle: {
      type: DataTypes.STRING, // without the @ symbol. Ex: 'asood123'
      set(username) {
        if (username.substr(0,1) === '@') {
          this.setDataValue('twitterHandle', username.substr(1));
        }
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
          isPublic: this.isPublic,
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
          contributors: this.data && this.data.githubContributors,
          name: this.name,
          logo: this.logo,
          backgroundImage: this.backgroundImage,
          publicUrl: this.publicUrl,
          mission: this.mission
        }
      },
      minimal() {
        return {
          id: this.id,
          name: this.name,
          logo: this.logo,
          publicUrl: this.publicUrl,
          mission: this.mission,
          isSupercollective: this.isSupercollective
        }
      }
    },

    instanceMethods: {
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
        return Sequelize.models.UserGroup.create({
          role,
          UserId: user.id,
          GroupId: this.id
        });
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
            throw new errors.NotFound(`No group with ID ${this.id} and host user found`);
          }

          return models.ConnectedAccount.find({
            where: {
              UserId: userGroup.UserId
            }
          });
        });
      },

      getExpenses(status, startDate, endDate) {
        endDate = endDate || new Date;
        const where = {
          amount: { $lt: 0 },
          createdAt: { $lte: endDate },
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
          SELECT
            (SELECT
             COALESCE(SUM( t."netAmountInGroupCurrency"*12),0)
              FROM "Subscriptions" s
              LEFT JOIN "Transactions" t
              ON (s.id = t."SubscriptionId"
                AND t.id = (SELECT MAX(id) from "Transactions" t where t."SubscriptionId" = s.id))
              WHERE "GroupId" = :GroupId
                AND t.amount > 0
                AND t."deletedAt" IS NULL
                AND s.interval = 'month'
                AND s."isActive" IS TRUE
                AND s."deletedAt" IS NULL)
            +
            (SELECT
              COALESCE(SUM(t."netAmountInGroupCurrency"),0) FROM "Transactions" t
              LEFT JOIN "Subscriptions" s ON t."SubscriptionId" = s.id
              WHERE "GroupId" = :GroupId
                AND t.amount > 0
                AND t."deletedAt" IS NULL
                AND ((s.interval = 'year' AND s."isActive" IS TRUE AND s."deletedAt" IS NULL) OR s.interval IS NULL))
            +
            (SELECT
              COALESCE(SUM(t."netAmountInGroupCurrency"),0) FROM "Transactions" t
              LEFT JOIN "Subscriptions" s ON t."SubscriptionId" = s.id
              WHERE "GroupId" = :GroupId
                AND t.amount > 0
                AND t."deletedAt" IS NULL
                AND s.interval = 'month' AND s."isActive" IS FALSE AND s."deletedAt" IS NULL)
            "yearlyIncome"
          `.replace(/\n/g, ' '), // this is to remove the new lines and save log space.
          {
            replacements: { GroupId: this.id },
            type: Sequelize.QueryTypes.SELECT
          }).then(result => Promise.resolve(parseInt(result[0].yearlyIncome,10)));
      },

      getTotalDonations() {
        return models.Transaction
          .find({
            attributes: [
              [Sequelize.fn('SUM', Sequelize.col('amount')), 'donationTotal']
            ],
            where: {
              GroupId: this.id,
              amount: {
                $gt: 0
              }
            }
          })
          .then((result) => {
            const json = result.toJSON();
            return Promise.resolve(Number(json.donationTotal));
          })
      },

      getBackersCount(until) {
        until = until || new Date;
        return models.Transaction
          .find({
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
          })
      },

      getTwitterSettings() {
        const settings = this.settings || {};
        settings.twitter = settings.twitter || {};
        const defaults = {
          // thank you message immediately when receiving donation
          thankDonationEnabled: false,
          thankDonation: '$backer thanks for backing us!',

          // thank you message to all backers on 1st day of the month
          monthlyThankDonationsEnabled: false,
          monthlyThankDonationsSingular: 'Thank you $backer for supporting our collective',
          monthlyThankDonationsPlural: 'Thanks to our $backerCount backers and sponsors $backerList for supporting our collective'
        };
        _.defaults(settings.twitter, defaults);

        return settings.twitter;
      },

      getRelatedGroups(limit) {
        // don't fetch related groups for supercollectives for now
        if (!this.isSupercollective) {
          limit = limit || 3
          return Group.getGroupsSummaryByTag(this.tags, limit, [this.id], 100, true);
        }
        return Promise.resolve();
      },

      hasHost() {
        return Sequelize.models.UserGroup.find({
          where: {
            GroupId: this.id,
            role: roles.HOST
          }
        })
        .then(userGroup => Promise.resolve(!!userGroup));
      },

      getSuperCollectiveData() {
        if (this.isSupercollective &&
          this.settings.superCollectiveTag &&
          this.settings.superCollectiveTag.length > 0) {
          return Group.getGroupsSummaryByTag(this.settings.superCollectiveTag, 100, [this.id], 0, false);
        }
        return Promise.resolve();
      }
    },

    classMethods: {
      getGroupsSummaryByTag: (tags, limit, excludeList, minTotalDonation, randomOrder, orderBy, orderDir, offset) => {
        limit = limit || 3;
        excludeList = excludeList || [];

        return queries.getGroupsByTag(tags, limit, excludeList, minTotalDonation, randomOrder, orderBy, orderDir, offset)
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
                  groupInfo.sponsorsCount = filter(values(backers), {tier: 'sponsor'}).length;
                  groupInfo.backersCount = groupInfo.backersAndSponsorsCount - groupInfo.sponsorsCount;
                  return groupInfo;
                });
            }));
          })
      }
    }
  });

  return Group;
}
