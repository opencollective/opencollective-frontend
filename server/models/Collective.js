/**
 * Dependencies.
 */
import _, { get, difference, uniq, pick, omit } from 'lodash';
import Temporal from 'sequelize-temporal';
import config from 'config';
import deepmerge from 'deepmerge';
import prependHttp from 'prepend-http';
import queries from '../lib/queries';
import { types } from '../constants/collectives';
import roles from '../constants/roles';
import { HOST_FEE_PERCENT } from '../constants/transactions';
import {
  capitalize,
  flattenArray,
  getDomain,
  formatCurrency,
} from '../lib/utils';
import slugify from 'limax';
import activities from '../constants/activities';
import Promise from 'bluebird';
import userlib from '../lib/userlib';
import CustomDataTypes from './DataTypes';
import { convertToCurrency } from '../lib/currency';
import emailLib from '../lib/email';
import debugLib from 'debug';
import fetch from 'isomorphic-fetch';
import crypto from 'crypto';
import moment from 'moment';
import { isBlacklistedCollectiveSlug } from '../lib/collectivelib';
const ics = require('ics'); // eslint-disable-line import/no-commonjs

const debug = debugLib('collective');

export const defaultTiers = (HostCollectiveId, currency) => {
  const tiers = [];

  if (HostCollectiveId === 858) {
    // if request coming from opencollective.com/meetups
    tiers.push({
      type: 'TIER',
      name: '1 month',
      description:
        'Sponsor our meetup and get: a shout-out on social media, presence on the merch table and your logo on our meetup page.',
      slug: '1month-sponsor',
      amount: 25000,
      button: 'become a sponsor',
      currency: currency,
    });
    tiers.push({
      type: 'TIER',
      name: '3 months',
      description:
        '**10% off!** - Sponsor our meetup and get: a shout-out on social media, presence on the merch table and your logo on our meetup page.',
      slug: '3month-sponsor',
      amount: 67500,
      button: 'become a sponsor',
      currency: currency,
    });
    tiers.push({
      type: 'TIER',
      name: '6 months',
      description:
        '**20% off!** - Sponsor our meetup and get: a shout-out on social media, presence on the merch table and your logo on our meetup page.',
      slug: '6month-sponsor',
      amount: 120000,
      button: 'become a sponsor',
      currency: currency,
    });
    return tiers;
  }
  if (tiers.length === 0) {
    tiers.push({
      type: 'TIER',
      name: 'backer',
      slug: 'backers',
      amount: 500,
      presets: [500, 1000, 2500, 5000],
      interval: 'month',
      currency: currency,
    });
    tiers.push({
      type: 'TIER',
      name: 'sponsor',
      slug: 'sponsors',
      amount: 10000,
      presets: [10000, 25000, 50000],
      interval: 'month',
      currency: currency,
    });
  }
  return tiers;
};

/**
 * Collective Model.
 *
 * There 3 types of collective at the moment
 * - Collective
 * - User: Collective with only one ADMIN
 * - Event: Time based collective with a parent collective
 */
export default function(Sequelize, DataTypes) {
  const { models, Op } = Sequelize;

  const Collective = Sequelize.define(
    'Collective',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      type: {
        type: DataTypes.STRING, // COLLECTIVE, USER, EVENT
        defaultValue: 'COLLECTIVE',
      },

      slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        set(slug) {
          if (slug && slug.toLowerCase) {
            this.setDataValue(
              'slug',
              slug
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/\./g, ''),
            );
          }
        },
      },

      name: DataTypes.STRING,
      company: DataTypes.STRING,

      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true, // non authenticated users can create a collective
      },

      LastEditedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true, // needs to be true because of old rows
      },

      ParentCollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      HostCollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      hostFeePercent: {
        type: DataTypes.FLOAT,
        defaultValue: HOST_FEE_PERCENT,
      },

      mission: DataTypes.STRING, // max 95 characters
      description: DataTypes.STRING, // max 95 characters

      longDescription: DataTypes.TEXT, // markdown
      expensePolicy: DataTypes.TEXT, // markdown

      currency: CustomDataTypes(DataTypes).currency,

      image: {
        type: DataTypes.STRING,
        get() {
          const image = this.getDataValue('image');
          if (image) return image;
          if (
            this.type === 'ORGANIZATION' &&
            this.website &&
            !this.website.match(/^https:\/\/twitter\.com\//)
          ) {
            const image = `https://logo.clearbit.com/${getDomain(
              this.website,
            )}`;
            return image;
          }
        },
      },

      backgroundImage: {
        type: DataTypes.STRING,
        get() {
          return this.getDataValue('backgroundImage');
        },
      },

      // Max amount to raise across all tiers
      maxAmount: {
        type: DataTypes.INTEGER, // In cents
        min: 0,
      },

      // Max quantity of tickets across all tiers
      maxQuantity: {
        type: DataTypes.INTEGER,
      },

      locationName: DataTypes.STRING,

      address: DataTypes.STRING,

      geoLocationLatLong: DataTypes.GEOMETRY('POINT'),

      settings: {
        type: DataTypes.JSON,
      },

      data: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      startsAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      endsAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      timezone: DataTypes.STRING,

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      twitterHandle: {
        type: DataTypes.STRING, // without the @ symbol. Ex: 'asood123'
        set(twitterHandle) {
          if (typeof twitterHandle !== 'string') return;
          this.setDataValue('twitterHandle', twitterHandle.replace(/^@/, ''));
        },
      },

      githubHandle: {
        type: DataTypes.STRING,
        set(githubHandle) {
          if (typeof githubHandle !== 'string') return;
          this.setDataValue('githubHandle', githubHandle.replace(/^@/, ''));
        },
      },

      website: {
        type: DataTypes.STRING,
        get() {
          const website = this.getDataValue('website');
          if (website) {
            return prependHttp(website);
          }
          return this.getDataValue('twitterHandle')
            ? `https://twitter.com/${this.getDataValue('twitterHandle')}`
            : null;
        },
      },

      publicUrl: {
        type: new DataTypes.VIRTUAL(DataTypes.STRING, ['slug']),
        get() {
          return `${config.host.website}/${this.get('slug')}`;
        },
      },

      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },

      isSupercollective: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      paranoid: true,

      getterMethods: {
        location() {
          return {
            name: this.locationName,
            address: this.address,
            lat:
              this.geoLocationLatLong &&
              this.geoLocationLatLong.coordinates &&
              this.geoLocationLatLong.coordinates[0],
            long:
              this.geoLocationLatLong &&
              this.geoLocationLatLong.coordinates &&
              this.geoLocationLatLong.coordinates[1],
          };
        },

        previewImage() {
          if (!this.image) return null;

          const cloudinaryBaseUrl =
            'https://res.cloudinary.com/opencollective/image/fetch';

          const format = this.image.match(/\.png$/) ? 'png' : 'jpg';

          const queryurl =
            this.type === 'USER'
              ? '/c_thumb,g_face,h_48,r_max,w_48,bo_3px_solid_white/c_thumb,h_48,r_max,w_48,bo_2px_solid_rgb:66C71A/e_trim'
              : '/h_96,c_fill';

          return `${cloudinaryBaseUrl}${queryurl}/f_${format}/${encodeURIComponent(
            this.image,
          )}`;
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
            githubHandle: this.githubHandle,
            publicUrl: this.publicUrl,
            hostFeePercent: this.hostFeePercent,
            tags: this.tags,
            HostCollectiveId: this.HostCollectiveId,
            isSupercollective: this.isSupercollective,
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
            description: this.description,
            settings: this.settings,
            currency: this.currency,
          };
        },
        // used to generate the invoice
        invoice() {
          return {
            id: this.id,
            createdAt: this.createdAt,
            name: this.name,
            slug: this.slug,
            image: this.image,
            backgroundImage: this.backgroundImage,
            publicUrl: this.publicUrl,
            locationName: this.locationName,
            address: this.address,
            description: this.description,
            settings: this.settings,
            currency: this.currency,
          };
        },
        minimal() {
          return {
            id: this.id,
            type: this.type,
            name: this.name,
            image: this.image,
            slug: this.slug,
            twitterHandle: this.twitterHandle,
            githubHandle: this.githubHandle,
            publicUrl: this.publicUrl,
            mission: this.mission,
            isSupercollective: this.isSupercollective,
          };
        },
        activity() {
          return {
            id: this.id,
            type: this.type,
            slug: this.slug,
            name: this.name,
            company: this.company,
            website: this.website,
            twitterHandle: this.twitterHandle,
            githubHandle: this.githubHandle,
            description: this.description,
            previewImage: this.previewImage,
          };
        },
        searchIndex() {
          return {
            id: this.id,
            name: this.name,
            description: this.description,
            currency: this.currency,
            slug: this.slug,
            type: this.type,
            mission: this.mission,
            tags: this.tags,
            locationName: this.locationName,
            balance: this.balance, // useful in ranking
            yearlyBudget: this.yearlyBudget,
            backersCount: this.backersCount,
          };
        },
      },

      hooks: {
        beforeValidate: instance => {
          if (instance.slug) return Promise.resolve();

          const potentialSlugs = [
            instance.slug,
            instance.image
              ? userlib.getUsernameFromGithubURL(instance.image)
              : null,
            instance.twitterHandle
              ? instance.twitterHandle.replace(/@/g, '')
              : null,
            instance.name ? instance.name.replace(/ /g, '-') : null,
          ];
          return Collective.generateSlug(potentialSlugs).then(slug => {
            if (!slug) {
              return Promise.reject(
                new Error(
                  "We couldn't generate a unique slug for this collective",
                  potentialSlugs,
                ),
              );
            }
            instance.slug = slug;
            return Promise.resolve();
          });
        },
        afterCreate: instance => {
          instance.findImage();

          // We only create an "opencollective" paymentMethod for collectives and events
          if (instance.type !== 'COLLECTIVE' && instance.type !== 'EVENT') {
            return null;
          }
          models.PaymentMethod.create({
            CollectiveId: instance.id,
            service: 'opencollective',
            type: 'collective',
            name: `${capitalize(instance.name)} ${capitalize(
              instance.type.toLowerCase(),
            )}`,
            primary: true,
            currency: instance.currency,
          });
          return null;
        },
      },
    },
  );

  /**
   * Instance Methods
   */

  /**
   * Returns the next goal with the progress and how much is missing (as one-time or monthly donation)
   * Used for the monthly reports to backers
   */
  Collective.prototype.getNextGoal = async function(until) {
    const goals = get(this, 'settings.goals');
    if (!goals) return null;
    const stats = {};
    goals.sort((a, b) => {
      if (a.amount < b.amount) return -1;
      else return 1;
    });

    let nextGoal;
    await Promise.each(goals, async goal => {
      if (nextGoal) return;
      if (goal.type === 'balance') {
        if (!stats.balance) {
          stats.balance = await this.getBalance(until);
        }
        if (stats.balance < goal.amount) {
          nextGoal = goal;
          nextGoal.progress =
            Math.round((stats.balance / goal.amount) * 100) / 100;
          nextGoal.percentage = `${Math.round(nextGoal.progress * 100)}%`;
          nextGoal.missing = { amount: goal.amount - stats.balance };
          return;
        }
      }
      if (goal.type === 'yearlyBudget') {
        if (!stats.yearlyBudget) {
          stats.yearlyBudget = await this.getYearlyIncome(until);
        }
        if (stats.yearlyBudget < goal.amount) {
          nextGoal = goal;
          nextGoal.progress =
            Math.round((stats.yearlyBudget / goal.amount) * 100) / 100;
          nextGoal.percentage = `${Math.round(nextGoal.progress * 100)}%`;
          nextGoal.missing = {
            amount: Math.round((goal.amount - stats.yearlyBudget) / 12),
            interval: 'month',
          };
          nextGoal.interval = 'year';
          return;
        }
      }
    });
    return nextGoal;
  };

  Collective.prototype.getParentCollective = function() {
    if (!this.ParentCollectiveId) return Promise.resolve(null);
    if (this.parentCollective) return Promise.resolve(this.parentCollective);
    return models.Collective.findById(this.ParentCollectiveId);
  };

  Collective.prototype.getICS = function() {
    if (this.type !== 'EVENT') {
      throw new Error('Can only generate ICS for collectives of type EVENT');
    }
    return new Promise(resolve => {
      return this.getParentCollective().then(parentCollective => {
        const url = `${config.host.website}/${parentCollective.slug}/events/${
          this.slug
        }`;
        const start = moment(this.startsAt)
          .format('YYYY-M-D-H-m')
          .split('-');
        const end = moment(this.endsAt)
          .format('YYYY-M-D-H-m')
          .split('-');
        let description = this.description || '';
        if (this.longDescription) {
          description += `\n\n${this.longDescription}`;
        }
        let location = this.location.name || '';
        if (this.location.address) {
          location += `, ${this.location.address}`;
        }
        const alarms = [
          {
            action: 'audio',
            trigger: { hours: 24, minutes: 0, before: true },
            repeat: 2,
            attachType: 'VALUE=URI',
            attach: 'Glass',
          },
          {
            action: 'audio',
            trigger: { hours: 72, minutes: 0, before: true },
            repeat: 2,
            attachType: 'VALUE=URI',
            attach: 'Glass',
          },
        ];
        const event = {
          title: this.name,
          description,
          start,
          end,
          location,
          url,
          status: 'CONFIRMED',
          organizer: {
            name: parentCollective.name,
            email: `hello@${parentCollective.slug}.opencollective.com`,
          },
          alarms,
        };
        if (this.location.lat) {
          event.geo = { lat: this.location.lat, lon: this.location.long };
        }
        ics.createEvent(event, (err, res) => {
          if (err) {
            console.error(
              `Error while generating the ics file for event id ${
                this.id
              } (${url})`,
              err,
            );
          }
          return resolve(res);
        });
      });
    });
  };

  // If no image has been provided, try to find a good image using clearbit/gravatar and save it if it returns 200
  Collective.prototype.findImage = function(user) {
    if (this.getDataValue('image')) return this.image;

    const checkAndUpdateImage = image => {
      return fetch(image).then(response => {
        if (response.status === 200) {
          return this.update({ image });
        }
      });
    };

    if (this.type === 'ORGANIZATION' && this.website) {
      const image = `https://logo.clearbit.com/${getDomain(this.website)}`;
      checkAndUpdateImage(image);
      return image;
    }

    if (this.type === 'USER') {
      if (user && user.email && user.name && user.name !== 'anonymous') {
        const md5 = crypto
          .createHash('md5')
          .update(user.email.toLowerCase().trim())
          .digest('hex');
        const avatar = `https://www.gravatar.com/avatar/${md5}?default=404`;
        checkAndUpdateImage(avatar);
        return avatar;
      }
    }
  };

  // run when attaching a Stripe Account to this user/organization collective
  Collective.prototype.becomeHost = function() {
    this.data = this.data || {};
    return models.PaymentMethod.findOne({
      where: { service: 'opencollective', CollectiveId: this.id },
    }).then(pm => {
      if (pm) return null;
      return models.PaymentMethod.create({
        CollectiveId: this.id,
        service: 'opencollective',
        type: 'collective',
        name: `${capitalize(this.name)} Collective`,
        primary: true,
        currency: this.currency,
      });
    });
  };

  // This is quite ugly, and only needed for events.
  // I'd argue that we should store the event slug as `${parentCollectiveSlug}/events/${eventSlug}`
  Collective.prototype.getUrlPath = function() {
    if (this.type === types.EVENT) {
      return models.Collective.findById(this.ParentCollectiveId, {
        attributes: ['id', 'slug'],
      }).then(parent => {
        return `/${parent.slug}/events/${this.slug}`;
      });
    } else {
      return Promise.resolve(`/${this.slug}`);
    }
  };

  // Returns the User model of the User that created this collective
  Collective.prototype.getUser = function() {
    switch (this.type) {
      case types.USER:
      case types.ORGANIZATION:
        return models.User.findById(this.CreatedByUserId);
      default:
        return Promise.resolve(null);
    }
  };

  /**
   * Returns all the users of a collective (admins, members, backers, followers, attendees, ...)
   * including all the admins of the organizations that are members/backers of this collective
   */
  Collective.prototype.getUsers = function() {
    debug('getUsers for ', this.id);
    return models.Member.findAll({
      where: { CollectiveId: this.id },
      include: [{ model: models.Collective, as: 'memberCollective' }],
    })
      .tap(memberships => debug('>>> members found', memberships.length))
      .map(membership => membership.memberCollective)
      .map(memberCollective => {
        debug(
          '>>> fetching user for',
          memberCollective.slug,
          memberCollective.type,
        );
        if (memberCollective.type === types.USER) {
          return memberCollective.getUser().then(user => [user]);
        } else {
          debug('User', memberCollective.slug, 'type: ', memberCollective.type);
          return memberCollective.getAdminUsers();
        }
      })
      .then(users => {
        const usersFlattened = flattenArray(users);
        return uniq(usersFlattened, user => user.id);
      });
  };

  Collective.prototype.getAdmins = function() {
    return models.Member.findAll({
      where: {
        CollectiveId: this.id,
        role: roles.ADMIN,
      },
      include: [{ model: models.Collective, as: 'memberCollective' }],
    }).map(member => member.memberCollective);
  };

  /**
   * Get the admin users { id, email } of this collective
   */
  Collective.prototype.getAdminUsers = async function() {
    if (this.type === 'USER') {
      return [await this.getUser()];
    }
    const admins = await models.Member.findAll({
      where: {
        CollectiveId: this.id,
        role: roles.ADMIN,
      },
    });
    const users = await Promise.map(admins, admin =>
      models.User.findOne({
        where: { CollectiveId: admin.MemberCollectiveId },
      }),
    );
    return users;
  };

  /**
   * Get the email addresses of the admins of this collective
   */
  Collective.prototype.getEmails = async function() {
    return this.getAdminUsers().then(users => users.map(u => u && u.email));
  };

  Collective.prototype.getEvents = function(query = {}) {
    return Collective.findAll({
      ...query,
      where: {
        ...query.where,
        ParentCollectiveId: this.id,
        type: types.EVENT,
      },
    });
  };

  /**
   * Return stats about backers based on the Members table
   *  - stats.backers.lastMonth: number of backers by endDate
   *  - stats.backers.previousMonth: number of backers by startDate
   *  - stats.backers.new: the number of backers whose first donation was after startDate
   */
  Collective.prototype.getBackersStats = function(startDate, endDate) {
    const getBackersUntil = until =>
      models.Member.count({
        where: {
          CollectiveId: this.id,
          role: roles.BACKER,
          createdAt: { [Op.lt]: until },
        },
      });

    return Promise.all([
      getBackersUntil(startDate),
      getBackersUntil(endDate),
    ]).then(results => {
      return {
        backers: {
          lastMonth: results[1],
          previousMonth: results[0],
          new: results[1] - results[0],
        },
      };
    });
  };

  /**
   * Get new orders in last time period
   * @param {*} startDate beginning of the time period
   * @param {*} endDate end of the time period
   */
  Collective.prototype.getNewOrders = async function(
    startDate = 0,
    endDate = new Date(),
  ) {
    const orders = await models.Order.findAll({
      where: {
        CollectiveId: this.id,
        createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
      },
      paranoid: false,
      include: [
        { model: models.Collective, as: 'fromCollective' },
        { model: models.Tier },
      ],
    });
    orders.sort((a, b) => {
      if (a.dataValues.totalAmount > b.dataValues.totalAmount) return -1;
      else return 1;
    });
    return orders;
  };

  /**
   * Get orders whose subscription was cancelled during last time period
   * @param {*} startDate beginning of the time period
   * @param {*} endDate end of the time period
   */
  Collective.prototype.getCancelledOrders = async function(
    startDate = 0,
    endDate = new Date(),
  ) {
    const orders = await models.Order.findAll({
      where: {
        CollectiveId: this.id,
      },
      include: [
        {
          model: models.Subscription,
          required: true,
          where: {
            deactivatedAt: { [Op.gte]: startDate, [Op.lt]: endDate },
          },
        },
        {
          model: models.Collective,
          as: 'fromCollective',
        },
        {
          model: models.Tier,
        },
      ],
    }).map(async order => {
      order.totalTransactions = await order.getTotalTransactions();
      return order;
    });

    orders.sort((a, b) => {
      if (a.dataValues.totalAmount > b.dataValues.totalAmount) return -1;
      else return 1;
    });

    return orders;
  };

  /**
   * Get the total number of backers (individuals or organizations that have given money to the collective)
   * @params: { type, since, until }
   * type: COLLECTIVE/USER/ORGANIZATION or an array of types
   * until: date till when to count the number of backers
   */
  Collective.prototype.getBackersCount = function(options = {}) {
    const query = {
      attributes: [
        [
          Sequelize.fn(
            'COUNT',
            Sequelize.fn('DISTINCT', Sequelize.col('FromCollectiveId')),
          ),
          'count',
        ],
      ],
      where: {
        CollectiveId: this.id,
        FromCollectiveId: { [Op.ne]: this.HostCollectiveId },
        type: 'CREDIT',
      },
    };

    if (options.since) {
      query.where.createdAt = query.where.createdAt || {};
      query.where.createdAt[Op.gte] = options.since;
    }
    if (options.until) {
      query.where.createdAt = query.where.createdAt || {};
      query.where.createdAt[Op.lt] = options.until;
    }

    if (options.type) {
      const types =
        typeof options.type === 'string' ? [options.type] : options.type;
      query.include = [
        {
          model: models.Collective,
          as: 'fromCollective',
          attributes: [],
          required: true,
          where: { type: { [Op.in]: types } },
        },
      ];
      query.raw = true; // need this otherwise it automatically also fetches Transaction.id which messes up everything
    }

    let method;
    if (options.group) {
      query.attributes.push('fromCollective.type');
      query.include = [
        {
          model: models.Collective,
          as: 'fromCollective',
          attributes: [],
          required: true,
        },
      ];
      query.raw = true; // need this otherwise it automatically also fetches Transaction.id which messes up everything
      query.group = options.group;
      method = 'findAll';
    } else {
      method = 'findOne';
    }

    return models.Transaction[method](query).then(res => {
      if (options.group) {
        const stats = { id: this.id };
        let all = 0;
        // when it's a raw query, the result is not in dataValues
        res.forEach(r => {
          stats[r.type] = r.count;
          all += r.count;
        });
        stats.all = all;
        debug('getBackersCount', stats);
        return stats;
      } else {
        const result = res.dataValues || res || {};
        debug('getBackersCount', result);
        if (!result.count) return 0;
        return Promise.resolve(Number(result.count));
      }
    });
  };

  Collective.prototype.getIncomingOrders = function(options) {
    const query = deepmerge(
      {
        where: { CollectiveId: this.id },
      },
      options,
    );
    return models.Order.findAll(query);
  };

  Collective.prototype.getOutgoingOrders = function(options) {
    const query = deepmerge(
      {
        where: { FromCollectiveId: this.id },
      },
      options,
    );
    return models.Order.findAll(query);
  };

  Collective.prototype.getRoleForMemberCollective = function(
    MemberCollectiveId,
  ) {
    if (!MemberCollectiveId) return null;
    return models.Member.findOne({
      where: { MemberCollectiveId, CollectiveId: this.id },
    }).then(member => member.role);
  };

  Collective.prototype.getSuperCollectiveCollectivesIds = function() {
    if (!this.isSupercollective) return Promise.resolve([this.id]);
    if (this.superCollectiveCollectivesIds)
      return Promise.resolve(this.superCollectiveCollectivesIds);
    return models.Collective.findAll({
      attributes: ['id'],
      where: {
        tags: { [Op.contains]: [this.settings.superCollectiveTag] },
      },
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
  Collective.prototype.getTiersWithUsers = function(
    options = {
      active: false,
      attributes: [
        'id',
        'username',
        'image',
        'firstDonation',
        'lastDonation',
        'totalDonations',
        'website',
      ],
    },
  ) {
    const tiersById = {};
    // Get the list of tiers for the collective (including deleted ones)
    return (
      models.Tier.findAll({ where: { CollectiveId: this.id }, paranoid: false })
        .then(tiers =>
          tiers.map(t => {
            tiersById[t.id] = t;
          }),
        )
        .then(() =>
          queries.getMembersWithTotalDonations(
            { CollectiveId: this.id, role: 'BACKER' },
            options,
          ),
        )
        // Map the users to their respective tier
        .map(backerCollective => {
          const include = options.active
            ? [{ model: models.Subscription, attributes: ['isActive'] }]
            : [];
          return models.Order.findOne({
            attributes: ['TierId'],
            where: {
              FromCollectiveId: backerCollective.id,
              CollectiveId: this.id,
              TierId: { [Op.ne]: null },
            },
            include,
          }).then(order => {
            if (!order) {
              debug('Collective.getTiersWithUsers: no order for a tier for ', {
                FromCollectiveId: backerCollective.id,
                CollectiveId: this.id,
              });
              return null;
            }
            const TierId = order.TierId;
            tiersById[TierId] = tiersById[TierId] || order.Tier;
            if (!tiersById[TierId]) {
              console.error(
                ">>> Couldn't find a tier with id",
                order.TierId,
                'collective: ',
                this.slug,
              );
              tiersById[TierId] = { dataValues: { users: [] } };
            }
            tiersById[TierId].dataValues.users =
              tiersById[TierId].dataValues.users || [];
            if (options.active) {
              backerCollective.isActive = order.Subscription.isActive;
            }
            debug(
              'adding to tier',
              TierId,
              'backer: ',
              backerCollective.dataValues.slug,
            );
            tiersById[TierId].dataValues.users.push(
              backerCollective.dataValues,
            );
          });
        })
        .then(() => {
          return Object.values(tiersById);
        })
    );
  };

  /**
   * Get the Tier object of a user
   * @param {*} user
   */
  Collective.prototype.getBackerTier = function(backerCollective) {
    if (backerCollective.role && backerCollective.role !== 'BACKER')
      return backerCollective;
    return models.Order.findOne({
      where: {
        FromCollectiveId: backerCollective.id,
        CollectiveId: this.id,
      },
      include: [{ model: models.Tier }],
    }).then(order => order && order.Tier);
  };

  /**
   * Add User to the Collective
   * @post Member( { CreatedByUserId: user.id, MemberCollectiveId: user.CollectiveId, CollectiveId: this.id })
   * @param {*} user { id, CollectiveId }
   * @param {*} role
   * @param {*} defaultAttributes
   */
  Collective.prototype.addUserWithRole = function(
    user,
    role,
    defaultAttributes = {},
  ) {
    if (role === roles.HOST) {
      return console.error(
        'Please use Collective.addHost(hostCollective, remoteUser);',
      );
    }

    const member = {
      role,
      CreatedByUserId: user.id,
      MemberCollectiveId: user.CollectiveId,
      CollectiveId: this.id,
      ...defaultAttributes,
    };

    debug('addUserWithRole', user.id, role, 'member', member);
    return Promise.all([
      models.Member.create(member),
      models.User.findById(member.CreatedByUserId, {
        include: [{ model: models.Collective, as: 'collective' }],
      }),
      models.User.findById(user.id, {
        include: [{ model: models.Collective, as: 'collective' }],
      }),
    ]).then(results => {
      const member = results[0];
      const remoteUser = results[1];
      const memberUser = results[2];

      switch (role) {
        case roles.BACKER:
        case roles.ATTENDEE:
        case roles.FOLLOWER:
          return Promise.props({
            memberCollective: models.Collective.findById(
              member.MemberCollectiveId,
            ),
            order: models.Order.findOne({
              where: {
                CollectiveId: this.id,
                FromCollectiveId: member.MemberCollectiveId,
              },
              include: [
                { model: models.Tier },
                { model: models.Subscription },
                { model: models.Collective, as: 'referral' },
              ],
              order: [['createdAt', 'ASC']],
            }),
            urlPath: this.getUrlPath(),
          }).then(({ order, urlPath, memberCollective }) => {
            const data = {
              collective: { ...this.minimal, urlPath },
              member: {
                ...member.info,
                memberCollective: memberCollective.activity,
              },
              order: order && {
                ...order.activity,
                tier: order.Tier && order.Tier.minimal,
                subscription: {
                  interval: order.Subscription && order.Subscription.interval,
                },
              },
            };
            if (order && order.referral) {
              data.order.referral = order.referral.minimal;
            }
            return models.Activity.create({
              CollectiveId: this.id,
              type: activities.COLLECTIVE_MEMBER_CREATED,
              data,
            });
          });

        case roles.MEMBER:
        case roles.ADMIN:
          // We don't notify if the new member is the logged in user
          if (
            get(remoteUser, 'collective.id') ===
            get(memberUser, 'collective.id')
          ) {
            return member;
          }
          // We only send the notification for new member for role MEMBER and ADMIN
          return emailLib.send(
            `${this.type}.newmember`.toLowerCase(),
            memberUser.email,
            {
              remoteUser: {
                email: remoteUser.email,
                collective: pick(remoteUser.collective, [
                  'slug',
                  'name',
                  'image',
                ]),
              },
              role: role.toLowerCase(),
              isAdmin: role === roles.ADMIN,
              collective: {
                slug: this.slug,
                name: this.name,
                type: this.type.toLowerCase(),
              },
              recipient: {
                collective: memberUser.collective.activity,
              },
              loginLink: `${config.host.website}/signin?next=/${
                memberUser.collective.slug
              }/edit`,
            },
            { cc: remoteUser.email },
          );
        default:
          return member;
      }
    });
  };

  // Used when creating a transactin to add a user to the collective as a backer if needed
  Collective.prototype.findOrAddUserWithRole = function(
    user,
    role,
    defaultAttributes,
  ) {
    return models.Member.findOne({
      where: {
        role,
        CreatedByUserId: user.id,
        MemberCollectiveId: user.CollectiveId,
        CollectiveId: this.id,
      },
    }).then(Member => {
      if (!Member) {
        return this.addUserWithRole(user, role, defaultAttributes);
      } else {
        return Member;
      }
    });
  };

  /**
   * Add the host in the Members table and updates HostCollectiveId
   * @param {*} hostCollective instanceof models.Collective
   * @param {*} creatorUser { id } (optional, falls back to hostCollective.CreatedByUserId)
   */
  Collective.prototype.addHost = async function(hostCollective, creatorUser) {
    if (this.HostCollectiveId) {
      throw new Error(
        `This collective already has a host (HostCollectiveId: ${
          this.HostCollectiveId
        })`,
      );
    }

    creatorUser = creatorUser || { id: hostCollective.CreatedByUserId };

    const member = {
      role: roles.HOST,
      CreatedByUserId: creatorUser
        ? creatorUser.id
        : hostCollective.CreatedByUserId,
      MemberCollectiveId: hostCollective.id,
      CollectiveId: this.id,
    };

    let isActive = false;
    if (creatorUser.isAdmin) {
      if (
        this.ParentCollectiveId &&
        creatorUser.isAdmin(this.ParentCollectiveId)
      ) {
        isActive = true;
      } else if (creatorUser.isAdmin(hostCollective.id)) {
        isActive = true;
      }
    }
    const updatedValues = {
      HostCollectiveId: hostCollective.id,
      currency: hostCollective.currency,
      isActive,
    };

    const promises = [models.Member.create(member), this.update(updatedValues)];

    if (this.type === types.COLLECTIVE) {
      let tiers = await this.getTiers();
      if (!tiers || tiers.length === 0) {
        tiers = defaultTiers(hostCollective.id, hostCollective.currency);
        promises.push(models.Tier.createMany(tiers, { CollectiveId: this.id }));
      } else {
        // if the collective already had some tiers, we delete the ones that don't have the same currency
        // and we recreate new ones
        tiers.map(t => {
          if (t.currency !== hostCollective.currency) {
            const newTierData = omit(t.dataValues, ['id']);
            newTierData.currency = hostCollective.currency;
            promises.push(models.Tier.create(newTierData));
            promises.push(t.destroy());
          }
        });
      }
      if (!updatedValues.isActive) {
        if (!creatorUser.collective && creatorUser.getCollective) {
          creatorUser.collective = await creatorUser.getCollective();
        }
        const data = {
          host: pick(hostCollective, ['id', 'name', 'slug']),
          collective: pick(this, [
            'id',
            'slug',
            'name',
            'description',
            'twitterHandle',
            'githubHandle',
            'website',
            'tags',
            'data',
          ]),
          user: {
            email: creatorUser.email,
            collective: pick(creatorUser.collective, [
              'id',
              'slug',
              'name',
              'website',
              'twitterHandle',
              'githubHandle',
            ]),
          },
        };
        promises.push(
          models.Activity.create({
            CollectiveId: this.id,
            type: activities.COLLECTIVE_APPLY,
            data,
          }),
        );
      }
    }

    await Promise.all(promises);
    return this;
  };

  /**
   * Change or remove host of the collective (only if balance === 0)
   * Note: when changing host, we also set the collective.isActive to false
   *       unless the creatorUser (remoteUser) is an admin of the host
   * @param {*} newHostCollective: { id }
   * @param {*} creatorUser { id }
   */
  Collective.prototype.changeHost = async function(
    newHostCollectiveId,
    creatorUser,
  ) {
    if (newHostCollectiveId === this.id) {
      // do nothing
      return;
    }
    const balance = await this.getBalance();
    if (balance > 0) {
      throw new Error(
        `Unable to change host: you still have a balance of ${formatCurrency(
          balance,
          this.currency,
        )}`,
      );
    }
    const membership = await models.Member.findOne({
      where: {
        CollectiveId: this.id,
        MemberCollectiveId: this.HostCollectiveId,
        role: roles.HOST,
      },
    });
    if (membership) {
      membership.destroy();
    }
    this.HostCollectiveId = null;
    this.isActive = false; // we should rename isActive to isApproved (by the host)
    if (newHostCollectiveId) {
      const newHostCollective = await models.Collective.findById(
        newHostCollectiveId,
      );
      if (!newHostCollective) {
        throw new Error('Host not found');
      }
      return this.addHost(newHostCollective, creatorUser);
    } else {
      // if we remove the host
      return this.save();
    }
  };

  // edit the list of members and admins of this collective (create/update/remove)
  // creates a User and a UserCollective if needed
  Collective.prototype.editMembers = function(members, defaultAttributes = {}) {
    if (!members) return Promise.resolve();
    return this.getMembers({
      where: { role: { [Op.in]: [roles.ADMIN, roles.MEMBER] } },
    })
      .then(oldMembers => {
        // remove the members that are not present anymore
        const diff = difference(
          oldMembers.map(t => t.id),
          members.map(t => t.id),
        );
        if (diff.length === 0) {
          return null;
        } else {
          debug('editMembers', 'delete', diff);
          return models.Member.update(
            { deletedAt: new Date() },
            { where: { id: { [Op.in]: diff } } },
          );
        }
      })
      .then(() => {
        return Promise.map(members, member => {
          if (member.id) {
            // Edit an existing membership (edit the role/description)
            const editableAttributes = pick(member, ['role', 'description']);
            debug(
              'editMembers',
              'update member',
              member.id,
              editableAttributes,
            );
            return models.Member.update(editableAttributes, {
              where: { id: member.id },
            });
          } else {
            // Create new membership
            const memberAttrs = {
              ...defaultAttributes,
              description: member.description,
            };

            member.CollectiveId = this.id;
            if (member.CreatedByUserId) {
              const user = {
                id: member.CreatedByUserId,
                CollectiveId: member.MemberCollectiveId,
              };
              return this.addUserWithRole(user, member.role, {
                TierId: member.TierId,
                ...memberAttrs,
              });
            } else {
              return models.User.findOrCreateByEmail(
                member.member.email,
                member.member,
              ).then(user => {
                return this.addUserWithRole(user, member.role, {
                  TierId: member.TierId,
                  ...memberAttrs,
                });
              });
            }
          }
        });
      })
      .then(() =>
        this.getMembers({
          where: { role: { [Op.in]: [roles.ADMIN, roles.MEMBER] } },
        }),
      );
  };

  // edit the tiers of this collective (create/update/remove)
  Collective.prototype.editTiers = function(tiers) {
    if (!tiers) return this.getTiers();

    return this.getTiers()
      .then(oldTiers => {
        // remove the tiers that are not present anymore in the updated collective
        const diff = difference(oldTiers.map(t => t.id), tiers.map(t => t.id));
        return models.Tier.update(
          { deletedAt: new Date() },
          { where: { id: { [Op.in]: diff } } },
        );
      })
      .then(() => {
        return Promise.map(tiers, tier => {
          if (tier.id) {
            return models.Tier.update(tier, { where: { id: tier.id } });
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

  /*
   * Assumes:
   * - only credit cards on stripe can be updated
   */

  Collective.prototype.editPaymentMethods = function(
    paymentMethods,
    defaultAttributes = {},
  ) {
    if (!paymentMethods) return Promise.resolve();
    // We only allow editing of Stripe Payment Methods for the moment
    // (to avoid marking other types as archived see issue #698)
    return models.PaymentMethod.findAll({
      where: {
        CollectiveId: this.id,
        archivedAt: { [Op.eq]: null },
        service: 'stripe',
        type: 'creditcard',
      },
    })
      .then(oldPaymentMethods => {
        // remove the paymentMethods that are not present anymore in the updated collective
        const diff = difference(
          oldPaymentMethods.map(t => t.id),
          paymentMethods.map(t => t.id),
        );
        return models.PaymentMethod.update(
          { archivedAt: new Date() },
          { where: { id: { [Op.in]: diff } } },
        );
      })
      .then(() => {
        return Promise.map(paymentMethods, pm => {
          if (pm.id) {
            return models.PaymentMethod.update(pm, { where: { id: pm.id } });
          } else {
            pm.CollectiveId = this.id;
            pm.currency = pm.currency || this.currency;
            models.PaymentMethod.update(
              { primary: false },
              {
                where: { CollectiveId: this.id, archivedAt: { [Op.eq]: null } },
              },
            );
            return models.PaymentMethod.createFromStripeSourceToken({
              ...defaultAttributes,
              ...pm,
              type: 'creditcard',
            }); // TODO: nicer to not have to hard code 'creditcard'
          }
        });
      });
  };

  Collective.prototype.getExpenses = function(
    status,
    startDate,
    endDate = new Date(),
  ) {
    const where = {
      createdAt: { [Op.lt]: endDate },
      CollectiveId: this.id,
    };
    if (status) where.status = status;
    if (startDate) where.createdAt[Op.gte] = startDate;

    return models.Expense.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  };

  Collective.prototype.getUpdates = function(
    status,
    startDate = 0,
    endDate = new Date(),
  ) {
    const where = {
      createdAt: { [Op.lt]: endDate },
      CollectiveId: this.id,
    };
    if (startDate) where.createdAt[Op.gte] = startDate;
    if (status === 'published') where.publishedAt = { [Op.ne]: null };

    return models.Update.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  };

  Collective.prototype.getTopExpenseCategories = function(startDate, endDate) {
    return queries.getTopExpenseCategories(this.id, {
      since: startDate,
      until: endDate,
    });
  };

  Collective.prototype.getTopVendors = function(startDate, endDate) {
    return queries.getTopVendorsForCollective(this.id, {
      since: startDate,
      until: endDate,
    });
  };

  // Returns the last payment method that has been confirmed attached to this collective
  Collective.prototype.getPaymentMethod = async function(
    where,
    mustBeConfirmed = true,
  ) {
    const query = {
      where: {
        ...where,
        CollectiveId: this.id,
      },
    };
    if (mustBeConfirmed) {
      query.where.confirmedAt = { [Op.ne]: null };
      query.order = [['confirmedAt', 'DESC']];
    } else {
      query.order = [['createdAt', 'DESC']];
    }
    return models.PaymentMethod.findOne(query).tap(paymentMethod => {
      if (!paymentMethod) {
        throw new Error('No payment method found');
      } else if (paymentMethod.endDate && paymentMethod.endDate < new Date()) {
        throw new Error('Payment method expired');
      }
    });
  };

  Collective.prototype.getBalance = function(until) {
    until = until || new Date();
    return models.Transaction.find({
      attributes: [
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('SUM', Sequelize.col('netAmountInCollectiveCurrency')),
            0,
          ),
          'total',
        ],
      ],
      where: {
        CollectiveId: this.id,
        createdAt: { [Op.lt]: until },
      },
    }).then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
  };

  Collective.prototype.getYearlyIncome = function() {
    /*
      Three cases:
      1) All active monthly subscriptions. Multiply by 12
      2) All one-time and yearly subscriptions
      3) All inactive monthly subscriptions that have contributed in the past
    */
    return Sequelize.query(
      `
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
        type: Sequelize.QueryTypes.SELECT,
      },
    ).then(result => Promise.resolve(parseInt(result[0].yearlyIncome, 10)));
  };

  Collective.prototype.getTotalAmountReceived = function(startDate, endDate) {
    endDate = endDate || new Date();
    const where = {
      amount: { [Op.gt]: 0 },
      createdAt: { [Op.lt]: endDate },
      CollectiveId: this.id,
    };
    if (startDate) where.createdAt[Op.gte] = startDate;
    return models.Transaction.find({
      attributes: [
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('SUM', Sequelize.col('amount')),
            0,
          ),
          'total',
        ],
      ],
      where,
    }).then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
  };

  // Get the total amount spent
  Collective.prototype.getTotalAmountSpent = function(startDate, endDate) {
    endDate = endDate || new Date();
    const where = {
      type: 'DEBIT',
      createdAt: { [Op.lt]: endDate },
      CollectiveId: this.id,
    };
    if (startDate) where.createdAt[Op.gte] = startDate;
    return models.Transaction.find({
      attributes: [
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('SUM', Sequelize.col('netAmountInCollectiveCurrency')),
            0,
          ),
          'total',
        ],
      ],
      where,
    }).then(result => Promise.resolve(-parseInt(result.toJSON().total, 10)));
  };

  // Get the average monthly spending based on last 90 days
  Collective.prototype.getMonthlySpending = function() {
    return queries
      .getCollectivesOrderedByMonthlySpending({
        where: { id: this.id },
        limit: 1,
      })
      .then(
        res =>
          res.collectives[0] && res.collectives[0].dataValues.monthlySpending,
      );
  };

  // Get the total amount raised through referral
  Collective.prototype.getTotalAmountRaised = function() {
    return models.Order.findAll({
      attributes: [
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('SUM', Sequelize.col('totalAmount')),
            0,
          ),
          'total',
        ],
        [Sequelize.fn('MAX', Sequelize.col('createdAt')), 'createdAt'],
        [Sequelize.fn('MAX', Sequelize.col('currency')), 'currency'],
      ],
      where: {
        ReferralCollectiveId: this.id,
      },
      group: ['currency'],
    })
      .then(rows => rows.map(r => r.dataValues))
      .then(amounts =>
        Promise.map(amounts, s =>
          convertToCurrency(s.total, s.currency, this.currency, s.createdAt),
        ),
      )
      .then(amounts => {
        let total = 0;
        amounts.map(a => (total += a));
        return Math.round(total);
      });
  };

  Collective.prototype.getTotalTransactions = function(
    startDate,
    endDate,
    type,
    attribute = 'netAmountInCollectiveCurrency',
  ) {
    endDate = endDate || new Date();
    const where = {
      createdAt: { [Op.lt]: endDate },
      CollectiveId: this.id,
    };
    if (startDate) where.createdAt[Op.gte] = startDate;
    if (type === 'donation') where.amount = { [Op.gt]: 0 };
    if (type === 'expense') where.amount = { [Op.lt]: 0 };
    return models.Transaction.find({
      attributes: [
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('SUM', Sequelize.col(attribute)),
            0,
          ),
          'total',
        ],
      ],
      where,
    }).then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
  };

  /**
   * Get the latest transactions made by this collective
   * @param {*} since
   * @param {*} until
   * @param {*} tags if not null, only takes into account donations made to collectives that contains one of those tags
   */
  Collective.prototype.getLatestTransactions = function(since, until, tags) {
    const conditionOnCollective = {};
    if (tags) {
      conditionOnCollective.tags = { [Op.overlap]: tags };
    }
    return models.Transaction.findAll({
      where: {
        FromCollectiveId: this.id,
        createdAt: { [Op.gte]: since || 0, [Op.lt]: until || new Date() },
      },
      order: [['amount', 'DESC']],
      include: [
        {
          model: models.Collective,
          as: 'collective',
          where: conditionOnCollective,
        },
      ],
    });
  };

  Collective.prototype.isHost = function() {
    if (this.type !== 'ORGANIZATION' && this.type !== 'USER')
      return Promise.resolve(false);
    return models.Member.findOne({
      where: { MemberCollectiveId: this.id, role: 'HOST' },
    }).then(r => Boolean(r));
  };

  Collective.prototype.isHostOf = function(CollectiveId) {
    return models.Collective.findOne({
      where: { id: CollectiveId, HostCollectiveId: this.id },
    }).then(r => Boolean(r));
  };

  Collective.prototype.getRelatedCollectives = function(
    limit = 3,
    minTotalDonationInCents = 10000,
    orderBy,
    orderDir,
  ) {
    return Collective.getCollectivesSummaryByTag(
      this.tags,
      limit,
      [this.id],
      minTotalDonationInCents,
      true,
      orderBy,
      orderDir,
    );
  };

  // get the host of the parent collective if any, or of this collective
  Collective.prototype.getHostCollective = function() {
    if (this.HostCollectiveId) {
      return models.Collective.findById(this.HostCollectiveId);
    }
    return models.Member.findOne({
      attributes: ['MemberCollectiveId'],
      where: { role: roles.HOST, CollectiveId: this.ParentCollectiveId },
      include: [{ model: models.Collective, as: 'memberCollective' }],
    }).then(m => {
      if (m && m.memberCollective) return m.memberCollective;
      return this.isHost().then(isHost => (isHost ? this : null));
    });
  };

  Collective.prototype.getHostCollectiveId = function() {
    if (this.HostCollectiveId) return Promise.resolve(this.HostCollectiveId);
    return models.Collective.getHostCollectiveId(
      this.ParentCollectiveId || this.id,
    ).then(HostCollectiveId => {
      this.HostCollectiveId = HostCollectiveId;
      return HostCollectiveId;
    });
  };

  Collective.prototype.getHostStripeAccount = function() {
    let HostCollectiveId;
    return this.getHostCollectiveId()
      .then(id => {
        HostCollectiveId = id;
        debug(
          'getHostStripeAccount for collective',
          this.slug,
          `(id: ${this.id})`,
          'HostCollectiveId',
          id,
        );
        return (
          id &&
          models.ConnectedAccount.findOne({
            where: { service: 'stripe', CollectiveId: id },
          })
        );
      })
      .then(stripeAccount => {
        debug(
          'getHostStripeAccount',
          'using stripe account',
          stripeAccount && stripeAccount.username,
        );
        if (!stripeAccount || !stripeAccount.token) {
          return Promise.reject(
            new Error(
              `The host for the ${
                this.name
              } collective has no Stripe account set up (HostCollectiveId: ${HostCollectiveId})`,
            ),
          );
        } else if (
          process.env.NODE_ENV !== 'production' &&
          _.includes(stripeAccount.token, 'live')
        ) {
          return Promise.reject(
            new Error(
              `You can't use a Stripe live key on ${process.env.NODE_ENV}`,
            ),
          );
        } else {
          return stripeAccount;
        }
      });
  };

  Collective.prototype.setStripeAccount = function(stripeAccount) {
    if (!stripeAccount) return Promise.resolve(null);

    if (stripeAccount.id) {
      return models.ConnectedAccount.update(
        { CollectiveId: this.id },
        { where: { id: stripeAccount.id }, limit: 1 },
      );
    } else {
      return models.ConnectedAccount.create({
        service: 'stripe',
        ...stripeAccount,
        CollectiveId: this.id,
      });
    }
  };

  Collective.prototype.getSuperCollectiveData = function() {
    if (
      this.isSupercollective &&
      this.settings.superCollectiveTag &&
      this.settings.superCollectiveTag.length > 0
    ) {
      return Collective.getCollectivesSummaryByTag(
        this.settings.superCollectiveTag,
        10000,
        [this.id],
        0,
        false,
      );
    }
    return Promise.resolve();
  };

  Collective.prototype.getTopBackers = function(since, until, limit) {
    return queries
      .getMembersWithTotalDonations(
        { CollectiveId: this.id, role: 'BACKER' },
        { since, until, limit },
      )
      .tap(backers => debug('getTopBackers', backers.map(b => b.dataValues)));
  };

  /**
   * Class Methods
   */
  Collective.createOrganization = (collectiveData, adminUser, creator = {}) => {
    const CreatedByUserId = creator.id || adminUser.id;
    return Collective.create({
      CreatedByUserId,
      ...collectiveData,
      type: types.ORGANIZATION,
      isActive: true,
    })
      .tap(collective => {
        return models.Member.create({
          CreatedByUserId,
          CollectiveId: collective.id,
          MemberCollectiveId: adminUser.CollectiveId,
          role: roles.ADMIN,
        });
      })
      .tap(collective => {
        return models.Activity.create({
          type: activities.ORGANIZATION_COLLECTIVE_CREATED,
          UserId: adminUser.id,
          CollectiveId: collective.id,
          data: {
            collective: pick(collective, ['name', 'slug']),
          },
        });
      });
  };

  Collective.createMany = (collectives, defaultValues) => {
    return Promise.map(
      collectives,
      u => Collective.create(_.defaults({}, u, defaultValues)),
      { concurrency: 1 },
    ).catch(console.error);
  };

  Collective.getTopBackers = (since, until, tags, limit) => {
    return queries
      .getTopBackers(since || 0, until || new Date(), tags, limit || 5)
      .tap(backers => debug('getTopBackers', backers.map(b => b.dataValues)));
  };

  Collective.getHostCollectiveId = async CollectiveId => {
    const res = await models.Member.findOne({
      attributes: ['MemberCollectiveId'],
      where: { CollectiveId, role: roles.HOST },
    });
    return res && res.MemberCollectiveId;
  };

  /*
  * If there is a username suggested, we'll check that it's valid or increase it's count
  * Otherwise, we'll suggest something.
  */
  Collective.generateSlug = suggestions => {
    /*
    * Checks a given slug in a list and if found, increments count and recursively checks again
    */
    const slugSuggestionHelper = (slugToCheck, slugList, count) => {
      const slug = count > 0 ? `${slugToCheck}${count}` : slugToCheck;
      if (slugList.indexOf(slug) === -1 && !isBlacklistedCollectiveSlug(slug)) {
        return slug;
      } else {
        return slugSuggestionHelper(`${slugToCheck}`, slugList, count + 1);
      }
    };

    suggestions = suggestions
      .filter(slug => (slug ? true : false)) // filter out any nulls
      .map(slug => slugify(slug)); // Will also trim, lowercase and remove + signs

    // fetch any matching slugs or slugs for the top choice in the list above
    return Sequelize.query(
      `
        SELECT slug FROM "Collectives" where slug like '${suggestions[0]}%'
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    )
      .then(userObjectList => userObjectList.map(user => user.slug))
      .then(slugList => slugSuggestionHelper(suggestions[0], slugList, 0));
  };

  Collective.findBySlug = (slug, options = {}) => {
    if (!slug || slug.length < 1) {
      return Promise.resolve(null);
    }
    return Collective.findOne({
      where: { slug: slug.toLowerCase() },
      ...options,
    }).then(collective => {
      if (!collective) {
        throw new Error(`No collective found with slug ${slug}`);
      }
      return collective;
    });
  };

  Collective.getCollectivesSummaryByTag = (
    tags,
    limit = 3,
    excludeList = [],
    minTotalDonationInCents,
    randomOrder,
    orderBy,
    orderDir,
    offset,
  ) => {
    debug(
      'getCollectivesSummaryByTag',
      tags,
      limit,
      excludeList,
      minTotalDonationInCents,
      randomOrder,
      orderBy,
      orderDir,
      offset,
    );
    return queries
      .getCollectivesByTag(
        tags,
        limit,
        excludeList,
        minTotalDonationInCents,
        randomOrder,
        orderBy,
        orderDir,
        offset,
      )
      .then(collectives => {
        debug(
          'getCollectivesSummaryByTag',
          collectives && collectives.length,
          'collectives found',
        );
        return Promise.all(
          collectives.map(collective => {
            debug('getCollectivesSummaryByTag', 'collective', collective.slug);
            return Promise.all([
              collective.getYearlyIncome(),
              queries
                .getMembersWithTotalDonations(
                  { CollectiveId: collective.id },
                  { role: 'BACKER' },
                )
                .then(users => models.Tier.appendTier(collective, users)),
            ]).then(results => {
              const usersByRole = {};
              const users = results[1];
              users.map(user => {
                usersByRole[user.dataValues.role] =
                  usersByRole[user.dataValues.role] || [];
                usersByRole[user.dataValues.role].push(user);
              });
              const collectiveInfo = collective.card;
              collectiveInfo.yearlyIncome = results[0];
              const backers = usersByRole[roles.BACKER] || [];
              collectiveInfo.backersAndSponsorsCount = backers.length;
              collectiveInfo.membersCount = (
                usersByRole[roles.ADMIN] || []
              ).length;
              collectiveInfo.sponsorsCount = backers.filter(
                b => b.tier && b.tier.name.match(/sponsor/i),
              ).length;
              collectiveInfo.backersCount =
                collectiveInfo.backersAndSponsorsCount -
                collectiveInfo.sponsorsCount;
              collectiveInfo.githubContributorsCount =
                collective.data && collective.data.githubContributors
                  ? Object.keys(collective.data.githubContributors).length
                  : 0;
              collectiveInfo.contributorsCount =
                collectiveInfo.membersCount +
                collectiveInfo.githubContributorsCount +
                collectiveInfo.backersAndSponsorsCount;
              return collectiveInfo;
            });
          }),
        );
      });
  };

  Collective.associate = m => {
    Collective.hasMany(m.ConnectedAccount);
    Collective.belongsToMany(m.Collective, {
      through: {
        model: m.Member,
        unique: false,
        foreignKey: 'MemberCollectiveId',
      },
      as: 'memberCollectives',
    });
    Collective.belongsToMany(m.Collective, {
      through: { model: m.Member, unique: false, foreignKey: 'CollectiveId' },
      as: 'memberOfCollectives',
    });
    Collective.hasMany(m.Member);
    Collective.hasMany(m.Activity);
    Collective.hasMany(m.Notification);
    Collective.hasMany(m.Transaction, {
      foreignKey: 'CollectiveId',
      as: 'transactions',
    }); // collective.getTransactions()
    Collective.hasMany(m.Tier, { as: 'tiers' });
  };

  Temporal(Collective, Sequelize);

  return Collective;
}
