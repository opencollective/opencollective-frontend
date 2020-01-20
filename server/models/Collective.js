import Temporal from 'sequelize-temporal';
import config from 'config';
import deepmerge from 'deepmerge';
import prependHttp from 'prepend-http';
import slugify from 'limax';
import Promise from 'bluebird';
import debugLib from 'debug';
import fetch from 'isomorphic-fetch';
import moment from 'moment';
import * as ics from 'ics';
import {
  get,
  difference,
  differenceBy,
  uniqBy,
  pick,
  pickBy,
  sumBy,
  keys,
  omit,
  defaults,
  includes,
  isNull,
} from 'lodash';
import uuid from 'uuid/v4';
import { isISO31661Alpha2 } from 'validator';
import { Op } from 'sequelize';

import CustomDataTypes from './DataTypes';

import logger from '../lib/logger';
import userlib from '../lib/userlib';
import emailLib from '../lib/email';
import queries from '../lib/queries';
import {
  isBlacklistedCollectiveSlug,
  collectiveSlugBlacklist,
  whitelistSettings,
  validateSettings,
  getCollectiveAvatarUrl,
} from '../lib/collectivelib';
import { invalidateContributorsCache } from '../lib/contributors';
import { capitalize, flattenArray, getDomain, formatCurrency, cleanTags, md5, strip_tags } from '../lib/utils';

import roles, { MemberRoleLabels } from '../constants/roles';
import activities from '../constants/activities';
import { HOST_FEE_PERCENT } from '../constants/transactions';
import { types } from '../constants/collectives';
import expenseStatus from '../constants/expense_status';
import expenseTypes from '../constants/expense_type';
import plans, { PLANS_COLLECTIVE_SLUG } from '../constants/plans';

import { getFxRate } from '../lib/currency';

const debug = debugLib('collective');
const debugcollectiveImage = debugLib('collectiveImage');

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
      minimumAmount: 500,
      amountType: 'FLEXIBLE',
    });
    tiers.push({
      type: 'TIER',
      name: 'sponsor',
      slug: 'sponsors',
      amount: 10000,
      presets: [10000, 25000, 50000],
      interval: 'month',
      currency: currency,
      minimumAmount: 10000,
      amountType: 'FLEXIBLE',
    });
  }
  return tiers;
};

const validTypes = ['USER', 'COLLECTIVE', 'ORGANIZATION', 'EVENT', 'BOT'];

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

  const Collective = Sequelize.define(
    'Collective',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      type: {
        type: DataTypes.STRING,
        defaultValue: 'COLLECTIVE',
        validate: {
          isIn: {
            args: [validTypes],
            msg: `Must be one of: ${validTypes}`,
          },
        },
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
        validate: {
          len: [1, 255],
          isLowercase: true,
          notIn: {
            args: [collectiveSlugBlacklist],
            msg: 'The slug given for this collective is a reserved keyword',
          },
          isValid(value) {
            if (!/^[\w-]+$/.test(value)) {
              throw new Error('Slug may only contain alphanumeric characters or hyphens.');
            }
          },
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
        validate: {
          min: 0,
          max: 100,
        },
      },

      mission: DataTypes.STRING, // max 95 characters
      description: DataTypes.STRING, // max 95 characters

      longDescription: {
        type: DataTypes.TEXT,
        set(longDescription) {
          if (longDescription) {
            this.setDataValue('longDescription', strip_tags(longDescription));
          } else {
            this.setDataValue('longDescription', null);
          }
        },
      },

      expensePolicy: DataTypes.TEXT, // markdown

      currency: CustomDataTypes(DataTypes).currency,

      image: {
        type: DataTypes.STRING,
        get() {
          const image = this.getDataValue('image');
          // Warning: some tests really want that value to be undefined and not null
          if (image) {
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
        validate: {
          min: 0,
        },
      },

      // Max quantity of tickets across all tiers
      maxQuantity: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
        },
      },

      locationName: DataTypes.STRING,

      address: DataTypes.STRING,

      countryISO: {
        type: DataTypes.STRING,
        validate: {
          len: 2,
          isCountryISO(value) {
            if (!(isNull(value) || isISO31661Alpha2(value))) {
              throw new Error('Invalid Country ISO.');
            }
          },
        },
      },

      geoLocationLatLong: DataTypes.GEOMETRY('POINT'),

      settings: {
        type: DataTypes.JSON,
        set(value) {
          this.setDataValue('settings', whitelistSettings(value));
        },
        validate: {
          validate(settings) {
            const error = validateSettings(settings);
            if (error) {
              throw new Error(error);
            }
          },
        },
      },

      isPledged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

      isIncognito: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      approvedAt: {
        type: DataTypes.DATE,
      },

      twitterHandle: {
        type: DataTypes.STRING, // without the @ symbol. Ex: 'asood123'
        set(twitterHandle) {
          if (!twitterHandle || twitterHandle.length === 0) {
            this.setDataValue('twitterHandle', null);
            return;
          }

          // Try to parse Twitter URL, fallback on regular string
          const twitterRegex = /https?:\/\/twitter\.com\/([^/\s]+)/;
          const regexResult = twitterHandle.match(twitterRegex);
          if (regexResult) {
            const [, username] = regexResult;
            this.setDataValue('twitterHandle', username);
          } else {
            this.setDataValue('twitterHandle', twitterHandle.replace(/^@/, ''));
          }
        },
      },

      githubHandle: {
        type: DataTypes.STRING,
        set(githubHandle) {
          if (!githubHandle || githubHandle.length === 0) {
            this.setDataValue('githubHandle', null);
            return;
          }

          // Try to parse github URL, fallback on regular string
          const githubUrlRegex = /https?:\/\/github\.com\/([^/\s]+)(\/([^/\s]+))?/;
          const regexResult = githubHandle.match(githubUrlRegex);
          if (regexResult) {
            const [, username, , repository] = regexResult;
            const formattedHandle = repository ? `${username}/${repository}` : username;
            this.setDataValue('githubHandle', formattedHandle);
          } else {
            this.setDataValue('githubHandle', githubHandle.replace(/^@/, ''));
          }
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
        set(url) {
          if (url) {
            this.setDataValue('website', prependHttp(url, { https: true }));
          } else {
            this.setDataValue('website', null);
          }
        },
      },

      publicUrl: {
        type: new DataTypes.VIRTUAL(DataTypes.STRING, ['slug']),
        get() {
          return `${config.host.website}/${this.get('slug')}`;
        },
      },

      inTheContextOfCollectiveId: {
        type: new DataTypes.VIRTUAL(DataTypes.STRING),
        description:
          'Variable to keep track of the Parent Collective Id when traversing the graph of collective relationships. This is needed to know if the current logged in user can access the createdByUser of the collective.',
      },

      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        set(tags) {
          this.setDataValue('tags', cleanTags(tags));
        },
      },

      isSupercollective: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      monthlySpending: {
        type: new DataTypes.VIRTUAL(DataTypes.INTEGER),
      },

      deactivatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      isHostAccount: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      plan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      paranoid: true,

      getterMethods: {
        location() {
          return {
            name: this.locationName,
            address: this.address,
            country: this.countryISO,
            lat:
              this.geoLocationLatLong && this.geoLocationLatLong.coordinates && this.geoLocationLatLong.coordinates[0],
            long:
              this.geoLocationLatLong && this.geoLocationLatLong.coordinates && this.geoLocationLatLong.coordinates[1],
          };
        },

        previewImage() {
          if (!this.image) {
            return null;
          }

          const cloudinaryBaseUrl = 'https://res.cloudinary.com/opencollective/image/fetch';

          const format = this.image.match(/\.png$/) ? 'png' : 'jpg';

          const queryurl =
            this.type === 'USER'
              ? '/c_thumb,g_face,h_48,r_max,w_48,bo_3px_solid_white/c_thumb,h_48,r_max,w_48,bo_2px_solid_rgb:66C71A/e_trim'
              : '/h_96,c_fill';

          return `${cloudinaryBaseUrl}${queryurl}/f_${format}/${encodeURIComponent(this.image)}`;
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
            isIncognito: this.isIncognito,
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
          if (instance.slug) {
            return Promise.resolve();
          }
          let potentialSlugs,
            useSlugify = true;
          if (instance.isIncognito) {
            useSlugify = false;
            potentialSlugs = [`incognito-${uuid().split('-')[0]}`];
          } else {
            potentialSlugs = [
              instance.slug,
              instance.image ? userlib.getUsernameFromGithubURL(instance.image) : null,
              instance.twitterHandle ? instance.twitterHandle.replace(/@/g, '') : null,
              instance.name ? instance.name.replace(/ /g, '-') : null,
            ];
          }
          return Collective.generateSlug(potentialSlugs, useSlugify).then(slug => {
            if (!slug) {
              return Promise.reject(
                new Error("We couldn't generate a unique slug for this collective", potentialSlugs),
              );
            }
            instance.slug = slug;
            return Promise.resolve();
          });
        },
        afterCreate: async instance => {
          instance.findImage();

          // We only create an "opencollective" paymentMethod for collectives and events
          if (instance.type === 'COLLECTIVE' || instance.type === 'EVENT') {
            await models.PaymentMethod.create({
              CollectiveId: instance.id,
              service: 'opencollective',
              type: 'collective',
              name: `${instance.name} (${capitalize(instance.type.toLowerCase())})`,
              primary: true,
              currency: instance.currency,
            });
          }

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
    if (!goals) {
      return null;
    }
    const stats = {};
    goals.sort((a, b) => {
      if (a.amount < b.amount) {
        return -1;
      } else {
        return 1;
      }
    });

    let nextGoal;
    await Promise.each(goals, async goal => {
      if (nextGoal) {
        return;
      }
      if (goal.type === 'balance') {
        if (!stats.balance) {
          stats.balance = await this.getBalance(until);
        }
        if (stats.balance < goal.amount) {
          nextGoal = goal;
          nextGoal.progress = Math.round((stats.balance / goal.amount) * 100) / 100;
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
          nextGoal.progress = Math.round((stats.yearlyBudget / goal.amount) * 100) / 100;
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
    if (!this.ParentCollectiveId) {
      return Promise.resolve(null);
    }
    if (this.parentCollective) {
      return Promise.resolve(this.parentCollective);
    }
    return models.Collective.findByPk(this.ParentCollectiveId);
  };

  Collective.prototype.getICS = function() {
    if (this.type !== 'EVENT') {
      throw new Error('Can only generate ICS for collectives of type EVENT');
    }
    return new Promise(resolve => {
      return this.getParentCollective().then(parentCollective => {
        const url = `${config.host.website}/${parentCollective.slug}/events/${this.slug}`;
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
        if (this.location.country) {
          location += `, ${this.location.country}`;
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
            logger.error(`Error while generating the ics file for event id ${this.id} (${url})`, err);
          }
          return resolve(res);
        });
      });
    });
  };

  // If no image has been provided, try to find an image using clearbit and save it
  Collective.prototype.findImage = function() {
    if (this.getDataValue('image')) {
      return;
    }

    if (this.type === 'ORGANIZATION' && this.website && !this.website.match(/^https:\/\/twitter\.com\//)) {
      const image = `https://logo.clearbit.com/${getDomain(this.website)}`;
      return this.checkAndUpdateImage(image);
    }

    return Promise.resolve();
  };

  // If no image has been provided, try to find an image using gravatar and save it
  Collective.prototype.findImageForUser = function(user) {
    if (this.getDataValue('image')) {
      return;
    }

    if (this.type === 'USER') {
      if (user && user.email && this.name && this.name !== 'incognito') {
        const emailHash = md5(user.email.toLowerCase().trim());
        const avatar = `https://www.gravatar.com/avatar/${emailHash}?default=404`;
        return this.checkAndUpdateImage(avatar);
      }
    }

    return Promise.resolve();
  };

  // Save image it if it returns 200
  Collective.prototype.checkAndUpdateImage = async function(image) {
    debugcollectiveImage(`checkAndUpdateImage ${this.slug} ${image}`);
    try {
      const response = await fetch(image);
      debugcollectiveImage(`checkAndUpdateImage ${this.slug} ${image} response.status: ${response.status}`);
      if (response.status !== 200) {
        throw new Error(`status=${response.status}`);
      }
      const body = await response.text();
      debugcollectiveImage(`checkAndUpdateImage ${this.slug} ${image} body.length: ${body.length}`);
      if (body.length === 0) {
        throw new Error(`length=0`);
      }
      debugcollectiveImage(`checkAndUpdateImage ${this.slug} ${image} updating`);
      return this.update({ image });
    } catch (err) {
      logger.info(`collective.checkAndUpdateImage: Unable to fetch ${image} (${err.message})`);
    }
  };

  // run when attaching a Stripe Account to this user/organization collective
  // this Payment Method will be used for "Add Funds"
  Collective.prototype.becomeHost = async function() {
    if (this.type !== 'USER' && this.type !== 'ORGANIZATION') {
      throw new Error('Only USER or ORGANIZATION can become Host.');
    }

    if (!this.isHostAccount) {
      await this.update({ isHostAccount: true });
    }

    const pm = await models.PaymentMethod.findOne({ where: { service: 'opencollective', CollectiveId: this.id } });
    if (!pm) {
      await models.PaymentMethod.create({
        CollectiveId: this.id,
        service: 'opencollective',
        type: 'collective',
        name: `${this.name} (Host)`,
        primary: true,
        currency: this.currency,
      });
    }
  };

  /**
   * If the collective is a host, it needs to remove existing hosted collectives before
   * deactivating it as a host.
   */
  Collective.prototype.deactivateAsHost = async function() {
    const hostedCollectives = await this.getHostedCollectivesCount();
    if (hostedCollectives >= 1) {
      throw new Error(
        `You can't deactivate hosting while still hosting ${hostedCollectives} other collectives. Please contact support: support@opencollective.com.`,
      );
    }

    // TODO unsubscribe from OpenCollective tier plan.

    await this.update({ isHostAccount: false });
  };

  /**
   * If the collective is a host, this function return true in case it's open to applications.
   * It does **not** check that the collective is indeed a host.
   */
  Collective.prototype.canApply = async function() {
    const canApplySetting = Boolean(this.settings && this.settings.apply);
    if (!canApplySetting) {
      return false;
    }

    const hostPlan = await this.getPlan();
    return !hostPlan.hostedCollectivesLimit || hostPlan.hostedCollectivesLimit > hostPlan.hostedCollectives;
  };

  /**
   *  Checks if the collective can be contacted.
   */
  Collective.prototype.canContact = async function() {
    if (!this.isActive) {
      return false;
    } else {
      return [types.COLLECTIVE, types.EVENT].includes(this.type) || (await this.isHost());
    }
  };

  /**
   * Checks if the has been approved by a host.
   * This function will throw if you try to call it with an event, as you should check the
   * `isApproved` of the `parentCollective` instead.
   */
  Collective.prototype.isApproved = function() {
    if (this.type === types.EVENT) {
      throw new Error("isApproved must be called on event's parent collective");
    } else {
      return Boolean(this.HostCollectiveId && this.isActive && this.approvedAt);
    }
  };

  // This is quite ugly, and only needed for events.
  // I'd argue that we should store the event slug as `${parentCollectiveSlug}/events/${eventSlug}`
  Collective.prototype.getUrlPath = function() {
    if (this.type === types.EVENT) {
      return models.Collective.findByPk(this.ParentCollectiveId, {
        attributes: ['id', 'slug'],
      }).then(parent => {
        if (!parent) {
          logger.error(`Event (${this.id}) with an invalid parent (${this.ParentCollectiveId}).`);
          return `/collective/events/${this.slug}`;
        }
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
        return models.User.findByPk(this.CreatedByUserId);
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
        debug('>>> fetching user for', memberCollective.slug, memberCollective.type);
        if (memberCollective.type === types.USER) {
          return memberCollective.getUser().then(user => [user]);
        } else {
          debug('User', memberCollective.slug, 'type: ', memberCollective.type);
          return memberCollective.getAdminUsers();
        }
      })
      .then(users => {
        const usersFlattened = flattenArray(users);
        return uniqBy(usersFlattened, 'id');
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

    return Promise.all([getBackersUntil(startDate), getBackersUntil(endDate)]).then(results => {
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
  Collective.prototype.getNewOrders = async function(startDate = 0, endDate = new Date(), where = {}) {
    const orders = await models.Order.findAll({
      where: {
        CollectiveId: this.id,
        createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
        ...where,
      },
      paranoid: false,
      include: [{ model: models.Collective, as: 'fromCollective' }, { model: models.Tier }],
    });
    orders.sort((a, b) => {
      if (a.dataValues.totalAmount > b.dataValues.totalAmount) {
        return -1;
      } else {
        return 1;
      }
    });
    return orders;
  };

  /**
   * Get orders whose subscription was cancelled during last time period
   * @param {*} startDate beginning of the time period
   * @param {*} endDate end of the time period
   */
  Collective.prototype.getCancelledOrders = async function(startDate = 0, endDate = new Date()) {
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
      if (a.dataValues.totalAmount > b.dataValues.totalAmount) {
        return -1;
      } else {
        return 1;
      }
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
      attributes: [[Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('FromCollectiveId'))), 'count']],
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
      const types = typeof options.type === 'string' ? [options.type] : options.type;
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
        if (!result.count) {
          return 0;
        }
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
      { clone: false },
    );
    return models.Order.findAll(query);
  };

  Collective.prototype.getOutgoingOrders = function(options) {
    const query = deepmerge(
      {
        where: { FromCollectiveId: this.id },
      },
      options,
      { clone: false },
    );
    return models.Order.findAll(query);
  };

  Collective.prototype.getRoleForMemberCollective = function(MemberCollectiveId) {
    if (!MemberCollectiveId) {
      return null;
    }
    return models.Member.findOne({
      where: { MemberCollectiveId, CollectiveId: this.id },
    }).then(member => member.role);
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
      attributes: ['id', 'username', 'image', 'firstDonation', 'lastDonation', 'totalDonations', 'website'],
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
        .then(() => queries.getMembersWithTotalDonations({ CollectiveId: this.id, role: 'BACKER' }, options))
        // Map the users to their respective tier
        .map(backerCollective => {
          const include = options.active ? [{ model: models.Subscription, attributes: ['isActive'] }] : [];
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
              logger.error(">>> Couldn't find a tier with id", order.TierId, 'collective: ', this.slug);
              tiersById[TierId] = { dataValues: { users: [] } };
            }
            tiersById[TierId].dataValues.users = tiersById[TierId].dataValues.users || [];
            if (options.active) {
              backerCollective.isActive = order.Subscription.isActive;
            }
            debug('adding to tier', TierId, 'backer: ', backerCollective.dataValues.slug);
            tiersById[TierId].dataValues.users.push(backerCollective.dataValues);
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
    if (backerCollective.role && backerCollective.role !== 'BACKER') {
      return backerCollective;
    }
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
  Collective.prototype.addUserWithRole = async function(user, role, defaultAttributes = {}, context = {}, transaction) {
    if (role === roles.HOST) {
      return logger.info('Please use Collective.addHost(hostCollective, remoteUser);');
    }

    const sequelizeParams = transaction ? { transaction } : undefined;

    const memberAttributes = {
      role,
      CreatedByUserId: user.id,
      MemberCollectiveId: user.CollectiveId,
      CollectiveId: this.id,
      ...defaultAttributes,
    };

    debug('addUserWithRole', user.id, role, 'member', memberAttributes);

    const member = await models.Member.create(memberAttributes, sequelizeParams);

    switch (role) {
      case roles.BACKER:
      case roles.ATTENDEE:
        if (!context.skipActivity) {
          await this.createMemberCreatedActivity(member, context, sequelizeParams);
        }
        break;

      case roles.MEMBER:
      case roles.ADMIN:
        invalidateContributorsCache(this.id);
        await this.sendNewMemberEmail(user, role, member, sequelizeParams);
        break;
    }

    return member;
  };

  Collective.prototype.createMemberCreatedActivity = async function(member, context, sequelizeParams) {
    // We refetch to preserve historic behavior and make sure it's up to date
    let order;
    if (context.order) {
      order = await models.Order.findOne(
        {
          where: { id: context.order.id },
          include: [{ model: models.Tier }, { model: models.Subscription }],
        },
        sequelizeParams,
      );
    }

    const urlPath = await this.getUrlPath();
    const memberCollective = await models.Collective.findByPk(member.MemberCollectiveId, sequelizeParams);

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

    return models.Activity.create(
      { CollectiveId: this.id, type: activities.COLLECTIVE_MEMBER_CREATED, data },
      sequelizeParams,
    );
  };

  Collective.prototype.sendNewMemberEmail = async function(user, role, member, sequelizeParams) {
    const remoteUser = await models.User.findByPk(
      member.CreatedByUserId,
      { include: [{ model: models.Collective, as: 'collective' }] },
      sequelizeParams,
    );

    const memberUser = await models.User.findByPk(
      user.id,
      { include: [{ model: models.Collective, as: 'collective' }] },
      sequelizeParams,
    );

    // We don't notify if the new member is the logged in user
    if (get(remoteUser, 'collective.id') === get(memberUser, 'collective.id')) {
      return;
    }

    // We only send the notification for new member for role MEMBER and ADMIN
    return emailLib.send(
      `${this.type}.newmember`.toLowerCase(),
      memberUser.email,
      {
        remoteUser: {
          email: remoteUser.email,
          collective: pick(remoteUser.collective, ['slug', 'name', 'image']),
        },
        role: MemberRoleLabels[role] || role.toLowerCase(),
        isAdmin: role === roles.ADMIN,
        collective: {
          slug: this.slug,
          name: this.name,
          type: this.type.toLowerCase(),
        },
        recipient: {
          collective: memberUser.collective.activity,
        },
        loginLink: `${config.host.website}/signin?next=/${memberUser.collective.slug}/edit`,
      },
      { bcc: remoteUser.email },
    );
  };

  /**
   * Used when creating a transactin to add a user to the collective as a backer if needed.
   * A new membership is registered for each `defaultAttributes.TierId`.
   */
  Collective.prototype.findOrAddUserWithRole = function(user, role, defaultAttributes, context, transaction) {
    return models.Member.findOne({
      where: {
        role,
        MemberCollectiveId: user.CollectiveId,
        CollectiveId: this.id,
        TierId: get(defaultAttributes, 'TierId', null),
      },
    }).then(Member => {
      if (!Member) {
        return this.addUserWithRole(user, role, defaultAttributes, context, transaction);
      } else {
        return Member;
      }
    });
  };

  Collective.prototype.updateHostFee = async function(hostFeePercent, remoteUser) {
    if (typeof hostFeePercent === undefined || !remoteUser || hostFeePercent === this.hostFeePercent) {
      return;
    }
    if (this.type === types.COLLECTIVE || this.type === types.EVENT) {
      // only an admin of the host of the collective can edit `hostFeePercent` of a COLLECTIVE
      if (!remoteUser || !remoteUser.isAdmin(this.HostCollectiveId)) {
        throw new Error('Only an admin of the host collective can edit the host fee for this collective');
      }
      return this.update({ hostFeePercent });
    } else {
      const isHost = await this.isHost();
      if (isHost) {
        if (!remoteUser.isAdmin(this.id)) {
          throw new Error('You must be an admin of this host to change the host fee');
        }
        const hostedCollectives = await models.Member.findAll({
          where: { MemberCollectiveId: this.id, role: roles.HOST },
        });
        const hostedCollectiveIds = hostedCollectives.map(m => m.CollectiveId);
        const collectives = await models.Collective.findAll({ where: { id: { [Op.in]: hostedCollectiveIds } } });
        // for some reason models.Collective.update({ hostFeePercent } , { where: { id: { [Op.in]: hostedCollectivesIds }}}) doesn't work :-/
        const promises = collectives.map(c => c.update({ hostFeePercent }));
        await Promise.all(promises);
        return this.update({ hostFeePercent });
      }
    }
    return this;
  };

  /**
   * Add the host in the Members table and updates HostCollectiveId
   * @param {*} hostCollective instanceof models.Collective
   * @param {*} creatorUser { id } (optional, falls back to hostCollective.CreatedByUserId)
   * @param {object} [options] (optional, to peform specific actions)
   */
  Collective.prototype.addHost = async function(hostCollective, creatorUser, options) {
    if (this.HostCollectiveId) {
      throw new Error(`This collective already has a host (HostCollectiveId: ${this.HostCollectiveId})`);
    }

    const hostPlan = await hostCollective.getPlan();
    if (hostPlan.hostedCollectivesLimit && hostPlan.hostedCollectives >= hostPlan.hostedCollectivesLimit) {
      throw new Error('Host is already hosting the maximum amount of collectives its plan allows');
    }

    const member = {
      role: roles.HOST,
      CreatedByUserId: creatorUser ? creatorUser.id : hostCollective.CreatedByUserId,
      MemberCollectiveId: hostCollective.id,
      CollectiveId: this.id,
    };

    let shouldAutomaticallyApprove = options && options.shouldAutomaticallyApprove;

    // If not forced, let's check for cases where we can still safely automatically approve collective
    if (!shouldAutomaticallyApprove) {
      if (creatorUser.isAdmin(hostCollective.id)) {
        // If user is admin of the host, we can automatically approve
        shouldAutomaticallyApprove = true;
      } else if (this.ParentCollectiveId && creatorUser.isAdmin(this.ParentCollectiveId)) {
        // If there's a parent collective already approved by the host and user is admin of it, we can also approve
        const parentCollective = await models.Collective.findByPk(this.ParentCollectiveId);
        if (parentCollective && parentCollective.HostCollectiveId === hostCollective.id && parentCollective.isActive) {
          shouldAutomaticallyApprove = true;
        }
      }
    }

    // If we can't automatically approve the collective and it is not open to new applications, reject it
    if (!shouldAutomaticallyApprove && !hostCollective.canApply()) {
      throw new Error('This host is not open to applications');
    }

    const updatedValues = {
      HostCollectiveId: hostCollective.id,
      hostFeePercent: hostCollective.hostFeePercent,
      ...(shouldAutomaticallyApprove ? { isActive: true, approvedAt: new Date() } : null),
    };

    // events should take the currency of their parent collective, not necessarily the host of their host.
    if (this.type === 'COLLECTIVE') {
      updatedValues.currency = hostCollective.currency;
    }

    const promises = [models.Member.create(member), this.update(updatedValues)];

    // Invalidate current collective payment method if there's one
    const collectivePaymentMethod = await models.PaymentMethod.findOne({
      where: {
        CollectiveId: this.id,
        service: 'opencollective',
        type: 'collective',
        deletedAt: null,
      },
    });

    if (collectivePaymentMethod) {
      promises.push(collectivePaymentMethod.destroy());
    }

    // Create the new payment method with host's currency
    if ([types.COLLECTIVE, types.EVENT].includes(this.type)) {
      promises.push(
        models.PaymentMethod.create({
          CollectiveId: this.id,
          service: 'opencollective',
          type: 'collective',
          name: `${capitalize(this.name)} (${capitalize(this.type.toLowerCase())})`,
          primary: true,
          currency: hostCollective.currency,
        }),
      );
    }

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
          host: pick(hostCollective, ['id', 'name', 'slug', 'hostFeePercent']),
          collective: pick(this, [
            'id',
            'slug',
            'name',
            'currency',
            'hostFeePercent',
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

        if (!options || !options.skipCollectiveApplyActivity) {
          promises.push(
            models.Activity.create({
              CollectiveId: this.id,
              type: activities.COLLECTIVE_APPLY,
              data,
            }),
          );
        }
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
  Collective.prototype.changeHost = async function(newHostCollectiveId, creatorUser) {
    if (newHostCollectiveId === this.id) {
      // do nothing
      return;
    }
    const balance = await this.getBalance();
    if (balance > 0) {
      throw new Error(`Unable to change host: you still have a balance of ${formatCurrency(balance, this.currency)}`);
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
    this.isActive = false;
    this.approvedAt = null;
    if (newHostCollectiveId) {
      const newHostCollective = await models.Collective.findByPk(newHostCollectiveId);
      if (!newHostCollective) {
        throw new Error('Host not found');
      }
      if (!newHostCollective.isHostAccount) {
        await newHostCollective.becomeHost();
      }
      return this.addHost(newHostCollective, creatorUser);
    } else {
      // if we remove the host
      return this.save();
    }
  };

  // edit the list of members and admins of this collective (create/update/remove)
  // creates a User and a UserCollective if needed
  Collective.prototype.editMembers = async function(members, defaultAttributes = {}) {
    if (!members || members.length === 0) {
      return null;
    }

    if (members.filter(m => m.role === roles.ADMIN).length === 0) {
      throw new Error('There must always be at least one collective admin');
    }

    // Ensure only ADMIN and MEMBER roles are used here
    members.forEach(member => {
      if (![roles.ADMIN, roles.MEMBER].includes(member.role)) {
        throw new Error(`Cant edit or create membership with role ${member.role}`);
      }
    });

    // Load existing data
    const [oldMembers, oldInvitations] = await Promise.all([
      this.getMembers({ where: { role: { [Op.in]: [roles.ADMIN, roles.MEMBER] } } }),
      models.MemberInvitation.findAll({
        where: { CollectiveId: this.id, role: { [Op.in]: [roles.ADMIN, roles.MEMBER] } },
      }),
    ]);

    // remove the members that are not present anymore
    const diff = differenceBy(oldMembers, members, 'id');
    if (diff.length > 0) {
      debug('editMembers', 'delete', diff);
      const diffMemberIds = diff.map(m => m.id);
      const diffMemberCollectiveIds = diff.map(m => m.MemberCollectiveId);
      const { remoteUserCollectiveId } = defaultAttributes;
      if (remoteUserCollectiveId && diffMemberCollectiveIds.indexOf(remoteUserCollectiveId) !== -1) {
        throw new Error(
          'You cannot remove yourself as a Collective admin. If you are the only admin, please add a new one and ask them to remove you.',
        );
      }
      await models.Member.update({ deletedAt: new Date() }, { where: { id: { [Op.in]: diffMemberIds } } });
    }

    // Remove the invitations that are not present anymore
    const invitationsDiff = oldInvitations.filter(invitation => {
      return !members.some(
        m => !m.id && m.member && m.member.id === invitation.MemberCollectiveId && m.role === invitation.role,
      );
    });

    if (invitationsDiff.length > 0) {
      await models.MemberInvitation.update(
        { deletedAt: new Date() },
        {
          where: {
            id: { [Op.in]: invitationsDiff.map(i => i.id) },
            CollectiveId: this.id,
          },
        },
      );
    }

    // Add new members
    for (const member of members) {
      const memberAttributes = {
        ...defaultAttributes,
        description: member.description,
        since: member.since,
        role: member.role,
      };

      if (member.id) {
        // Edit an existing membership (edit the role/description)
        const editableAttributes = pick(member, ['role', 'description', 'since']);
        debug('editMembers', 'update member', member.id, editableAttributes);
        await models.Member.update(editableAttributes, {
          where: {
            id: member.id,
            CollectiveId: this.id,
            role: { [Op.in]: [roles.ADMIN, roles.MEMBER] },
          },
        });
      } else if (member.member && member.member.id) {
        // Create new membership invitation
        await models.MemberInvitation.invite(this, { ...memberAttributes, MemberCollectiveId: member.member.id });
      } else if (member.member && member.member.email) {
        // Add user by email
        const user = await models.User.findOne({
          include: { model: models.Collective, as: 'collective', where: { type: types.USER, isIncognito: false } },
          where: { email: member.member.email },
        });

        if (user) {
          // If user exists for this email, send an invitation
          await models.MemberInvitation.invite(this, { ...memberAttributes, MemberCollectiveId: user.collective.id });
        } else {
          // Otherwise create and add the user directly
          const userFields = ['email', 'name', 'company', 'website'];
          const user = await models.User.createUserWithCollective(pick(member.member, userFields));
          await this.addUserWithRole(user, member.role, {
            ...memberAttributes,
            MemberCollectiveId: user.collective.id,
          });
        }
      } else {
        throw new Error('Invited member collective has not been set');
      }
    }

    invalidateContributorsCache(this.id);
    return this.getMembers({
      where: { role: { [Op.in]: [roles.ADMIN, roles.MEMBER] } },
    });
  };

  Collective.schema('public');

  // edit the tiers of this collective (create/update/remove)
  Collective.prototype.editTiers = function(tiers) {
    if (!tiers) {
      return this.getTiers();
    }

    return this.getTiers()
      .then(oldTiers => {
        // remove the tiers that are not present anymore in the updated collective
        const diff = difference(
          oldTiers.map(t => t.id),
          tiers.map(t => t.id),
        );
        return models.Tier.update({ deletedAt: new Date() }, { where: { id: { [Op.in]: diff } } });
      })
      .then(() => {
        return Promise.map(tiers, tier => {
          if (tier.id) {
            return models.Tier.update(tier, { where: { id: tier.id, CollectiveId: this.id } });
          } else {
            tier.CollectiveId = this.id;
            tier.currency = tier.currency || this.currency;
            return models.Tier.create(tier);
          }
        });
      })
      .then(() => this.getTiers());
  };

  // Where `this` collective is a type == ORGANIZATION collective.
  Collective.prototype.getExpensesForHost = function(
    status,
    startDate,
    endDate = new Date(),
    createdByUserId,
    excludedTypes,
  ) {
    const where = {
      createdAt: { [Op.lt]: endDate },
    };
    if (status) {
      where.status = status;
    }
    if (startDate) {
      where.createdAt[Op.gte] = startDate;
    }
    if (createdByUserId) {
      where.UserId = createdByUserId;
    }
    if (excludedTypes) {
      where.type = { [Op.or]: [{ [Op.eq]: null }, { [Op.notIn]: excludedTypes }] };
    }

    return models.Expense.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: models.Collective,
          as: 'collective',
          where: { HostCollectiveId: this.id },
        },
      ],
    });
  };

  Collective.prototype.getExpenses = function(status, startDate, endDate = new Date(), createdByUserId, excludedTypes) {
    const where = {
      createdAt: { [Op.lt]: endDate },
      CollectiveId: this.id,
    };
    if (status) {
      where.status = status;
    }
    if (startDate) {
      where.createdAt[Op.gte] = startDate;
    }
    if (createdByUserId) {
      where.UserId = createdByUserId;
    }
    if (excludedTypes) {
      where.type = { [Op.or]: [{ [Op.eq]: null }, { [Op.notIn]: excludedTypes }] };
    }

    return models.Expense.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  };

  Collective.prototype.getUpdates = function(status, startDate = 0, endDate = new Date()) {
    const where = {
      createdAt: { [Op.lt]: endDate },
      CollectiveId: this.id,
    };
    if (startDate) {
      where.createdAt[Op.gte] = startDate;
    }
    if (status === 'published') {
      where.publishedAt = { [Op.ne]: null };
    }

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

  // Returns the last payment method that has been confirmed attached to this collective
  Collective.prototype.getPaymentMethod = async function(where, mustBeConfirmed = true) {
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
    return models.Transaction.findOne({
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('netAmountInCollectiveCurrency')), 0), 'total'],
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
          AND t."RefundTransactionId" IS NULL
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
            AND t."RefundTransactionId" IS NULL
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
            AND t."RefundTransactionId" IS NULL
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
    if (startDate) {
      where.createdAt[Op.gte] = startDate;
    }
    return models.Transaction.findOne({
      attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amount')), 0), 'total']],
      where,
    }).then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
  };

  /**
   * Get the total amount spent by this collective, either directly or by
   * others through generated VirtualCards.
   */
  Collective.prototype.getTotalAmountSpent = function(startDate, endDate) {
    endDate = endDate || new Date();
    const createdAt = startDate ? { [Op.lt]: endDate, [Op.gte]: startDate } : { [Op.lt]: endDate };

    return models.Transaction.findAll({
      attributes: [
        'currency',
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('netAmountInCollectiveCurrency')), 0), 'total'],
      ],
      group: ['currency'],
      where: {
        type: 'DEBIT',
        createdAt: createdAt,
        [Op.or]: {
          CollectiveId: this.id,
          UsingVirtualCardFromCollectiveId: this.id,
        },
      },
      raw: true,
    }).then(async result => {
      let totalAmount = 0;
      for (const amount of result) {
        let total = -parseInt(amount.total, 10);
        if (amount.currency !== this.currency) {
          const fxRate = await getFxRate(amount.currency, this.currency);
          total = fxRate * total;
        }
        totalAmount = total + totalAmount;
      }
      return Math.round(totalAmount);
    });
  };

  // Get the average monthly spending based on last 90 days
  Collective.prototype.getMonthlySpending = function() {
    return queries
      .getCollectivesOrderedByMonthlySpending({
        where: { id: this.id },
        limit: 1,
      })
      .then(res => res.collectives[0] && res.collectives[0].dataValues.monthlySpending);
  };

  /**
   * A sequelize OR condition that will select all collective transactions:
   * - Debit transactions made by collective
   * - Debit transactions made using a virtual card from collective
   * - Credit transactions made to collective
   *
   * @param {bool} includeUsedVirtualCardsEmittedByOthers will remove transactions using virtual
   *  cards from other collectives when set to false.
   */
  Collective.prototype.transactionsWhereQuery = function(includeUsedVirtualCardsEmittedByOthers = true) {
    const debitTransactionOrQuery = includeUsedVirtualCardsEmittedByOthers
      ? // Include all transactions made by this collective or using one of its
        // virtual cards
        { CollectiveId: this.id, UsingVirtualCardFromCollectiveId: this.id }
      : // Either Collective made the transaction without using a virtual card,
        // or a transaction was made using one of its virtual cards - but don't
        // include virtual cards used emitted by other collectives
        [
          { CollectiveId: this.id, UsingVirtualCardFromCollectiveId: null },
          { UsingVirtualCardFromCollectiveId: this.id },
        ];

    return {
      [Op.or]: [
        // Debit transactions
        {
          type: 'DEBIT',
          [Op.or]: debitTransactionOrQuery,
        },
        // Credit transactions
        {
          type: 'CREDIT',
          CollectiveId: this.id,
        },
      ],
    };
  };

  /**
   * Get all transactions for this collective.
   */
  Collective.prototype.getTransactions = function({
    HostCollectiveId,
    startDate,
    endDate,
    type,
    offset,
    limit,
    attributes,
    order = [['createdAt', 'DESC']],
    includeUsedVirtualCardsEmittedByOthers = true,
    includeExpenseTransactions = true,
  }) {
    // Base query
    const query = { where: this.transactionsWhereQuery(includeUsedVirtualCardsEmittedByOthers) };

    // Select attributes
    if (attributes) {
      query.attributes = attributes;
    }

    // Hide expenses transactions on demand
    if (includeExpenseTransactions === false) {
      query.where.ExpenseId = null;
    }

    // Filter on host
    if (HostCollectiveId) {
      query.where.HostCollectiveId = HostCollectiveId;
    }

    // Filter on date
    if (startDate && endDate) {
      query.where.createdAt = { [Op.gte]: startDate, [Op.lt]: endDate };
    } else if (startDate) {
      query.where.createdAt = { [Op.gte]: startDate };
    } else if (endDate) {
      query.where.createdAt = { [Op.lt]: endDate };
    }

    // Filter on type
    if (type) {
      query.where.type = type;
    }

    // Pagination
    if (limit) {
      query.limit = limit;
    }
    if (offset) {
      query.offset = offset;
    }

    // OrderBy
    if (order) {
      query.order = order;
    }

    return models.Transaction.findAll(query);
  };

  Collective.prototype.getTotalTransactions = function(
    startDate,
    endDate,
    type,
    attribute = 'netAmountInCollectiveCurrency',
  ) {
    endDate = endDate || new Date();
    const where = {
      ...this.transactionsWhereQuery(),
      createdAt: { [Op.lt]: endDate },
    };
    if (startDate) {
      where.createdAt[Op.gte] = startDate;
    }
    if (type === 'donation') {
      where.amount = { [Op.gt]: 0 };
    }
    if (type === 'expense') {
      where.amount = { [Op.lt]: 0 };
    }
    return models.Transaction.findOne({
      attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col(attribute)), 0), 'total']],
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
    if (this.isHostAccount) {
      return Promise.resolve(true);
    }

    if (this.type !== 'ORGANIZATION' && this.type !== 'USER') {
      return Promise.resolve(false);
    }

    return models.Member.findOne({ where: { MemberCollectiveId: this.id, role: 'HOST' } }).then(r => Boolean(r));
  };

  Collective.prototype.isHostOf = function(CollectiveId) {
    return models.Collective.findOne({
      where: { id: CollectiveId, HostCollectiveId: this.id },
    }).then(r => Boolean(r));
  };

  Collective.prototype.getRelatedCollectives = function(limit = 3, minTotalDonationInCents = 10000, orderBy, orderDir) {
    return Collective.getCollectivesSummaryByTag(
      this.tags,
      limit,
      [this.id],
      minTotalDonationInCents,
      true,
      orderBy,
      orderDir,
    ).then(({ collectives }) => collectives);
  };

  // get the host of the parent collective if any, or of this collective
  Collective.prototype.getHostCollective = function() {
    if (this.HostCollectiveId) {
      return models.Collective.findByPk(this.HostCollectiveId);
    }
    return models.Member.findOne({
      attributes: ['MemberCollectiveId'],
      where: { role: roles.HOST, CollectiveId: this.ParentCollectiveId },
      include: [{ model: models.Collective, as: 'memberCollective' }],
    }).then(m => {
      if (m && m.memberCollective) {
        return m.memberCollective;
      }
      return this.isHost().then(isHost => (isHost ? this : null));
    });
  };

  Collective.prototype.getHostCollectiveId = function() {
    if (this.HostCollectiveId) {
      return Promise.resolve(this.HostCollectiveId);
    }
    return models.Collective.getHostCollectiveId(this.ParentCollectiveId || this.id).then(HostCollectiveId => {
      this.HostCollectiveId = HostCollectiveId;
      return HostCollectiveId;
    });
  };

  Collective.prototype.getHostStripeAccount = function() {
    let HostCollectiveId;
    return this.getHostCollectiveId()
      .then(id => {
        HostCollectiveId = id;
        debug('getHostStripeAccount for collective', this.slug, `(id: ${this.id})`, 'HostCollectiveId', id);
        return (
          id &&
          models.ConnectedAccount.findOne({
            where: { service: 'stripe', CollectiveId: id },
            order: [['createdAt', 'DESC']],
          })
        );
      })
      .then(stripeAccount => {
        debug('getHostStripeAccount', 'using stripe account', stripeAccount && stripeAccount.username);
        if (!stripeAccount || !stripeAccount.token) {
          return Promise.reject(
            new Error(
              `The host for the ${this.name} collective has no Stripe account set up (HostCollectiveId: ${HostCollectiveId})`,
            ),
          );
        } else if (process.env.NODE_ENV !== 'production' && includes(stripeAccount.token, 'live')) {
          return Promise.reject(new Error(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
        } else {
          return stripeAccount;
        }
      });
  };

  Collective.prototype.setStripeAccount = function(stripeAccount) {
    if (!stripeAccount) {
      return Promise.resolve(null);
    }

    if (stripeAccount.id) {
      return models.ConnectedAccount.update({ CollectiveId: this.id }, { where: { id: stripeAccount.id }, limit: 1 });
    } else {
      return models.ConnectedAccount.create({
        service: 'stripe',
        ...stripeAccount,
        CollectiveId: this.id,
      });
    }
  };

  Collective.prototype.getTopBackers = function(since, until, limit) {
    return queries
      .getMembersWithTotalDonations({ CollectiveId: this.id, role: 'BACKER' }, { since, until, limit })
      .tap(backers =>
        debug(
          'getTopBackers',
          backers.map(b => b.dataValues),
        ),
      );
  };

  Collective.prototype.getImageUrl = function(args = {}) {
    return getCollectiveAvatarUrl(this.slug, this.type, this.image, args);
  };

  Collective.prototype.getBackgroundImageUrl = function(args = {}) {
    if (!this.backgroundImage) {
      return null;
    }

    const sections = [config.host.images, this.slug];

    sections.push(md5(this.backgroundImage).substring(0, 7));

    sections.push('background');

    if (args.height) {
      sections.push(args.height);
    }

    return `${sections.join('/')}.${args.format || 'png'}`;
  };

  Collective.prototype.getHostedCollectivesCount = function() {
    // This method is intended for hosts
    if (!this.isHostAccount) {
      return Promise.resolve(null);
    }
    return models.Collective.count({
      where: { HostCollectiveId: this.id, type: types.COLLECTIVE },
    });
  };

  Collective.prototype.getTotalAddedFunds = async function() {
    // This method is intended for hosts
    if (!this.isHostAccount) {
      return Promise.resolve(null);
    }
    // This method is intended for hosts
    const result = await models.Transaction.findOne({
      attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amount')), 0), 'total']],
      where: { type: 'CREDIT', HostCollectiveId: this.id, platformFeeInHostCurrency: 0 },
      raw: true,
    });

    return result.total;
  };

  Collective.prototype.getPlan = async function() {
    const [hostedCollectives, addedFunds] = await Promise.all([
      this.getHostedCollectivesCount(),
      this.getTotalAddedFunds(),
    ]);
    if (this.plan) {
      const tier = await models.Tier.findOne({
        where: { slug: this.plan, deletedAt: null },
        include: [{ model: models.Collective, where: { slug: PLANS_COLLECTIVE_SLUG } }],
      });
      const plan = (tier && tier.data) || plans[this.plan];
      if (plan) {
        const extraPlanData = get(this.data, 'plan', {});
        return { name: this.plan, hostedCollectives, addedFunds, ...plan, ...extraPlanData };
      }
    }
    return { name: 'default', hostedCollectives, addedFunds, ...plans.default };
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
    return Promise.map(collectives, u => Collective.create(defaults({}, u, defaultValues)), { concurrency: 1 }).catch(
      logger.error,
    );
  };

  Collective.getTopBackers = (since, until, tags, limit) => {
    return queries.getTopBackers(since || 0, until || new Date(), tags, limit || 5).tap(backers =>
      debug(
        'getTopBackers',
        backers.map(b => b.dataValues),
      ),
    );
  };

  Collective.prototype.doesUserHaveTotalExpensesOverThreshold = async function({ threshold, year, UserId }) {
    const { PENDING, APPROVED, PAID } = expenseStatus;
    const since = moment({ year });
    const until = moment({ year }).add(1, 'y');
    const status = [PENDING, APPROVED, PAID];
    const excludedTypes = [expenseTypes.RECEIPT];

    const expenses = await this.getExpensesForHost(status, since, until, UserId, excludedTypes);

    const userTotal = sumBy(expenses, 'amount');

    return userTotal >= threshold;
  };

  Collective.prototype.getUsersWhoHaveTotalExpensesOverThreshold = async function({ threshold, year }) {
    const { PENDING, APPROVED, PAID } = expenseStatus;
    const since = moment({ year });
    const until = moment({ year }).add(1, 'y');
    const status = [PENDING, APPROVED, PAID];
    const excludedTypes = [expenseTypes.RECEIPT];
    const expenses = await this.getExpensesForHost(status, since, until, null, excludedTypes);

    const userTotals = expenses.reduce((totals, expense) => {
      const { UserId } = expense;

      totals[UserId] = totals[UserId] || 0;
      totals[UserId] += expense.amount;

      return totals;
    }, {});

    const userAmountsThatCrossThreshold = pickBy(userTotals, total => total >= threshold);

    const userIdsThatCrossThreshold = keys(userAmountsThatCrossThreshold).map(Number);

    return models.User.findAll({
      where: {
        id: userIdsThatCrossThreshold,
      },
    });
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
  Collective.generateSlug = (suggestions, useSlugify = true) => {
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

    suggestions = suggestions.filter(slug => (slug ? true : false)); // filter out any nulls

    if (useSlugify) {
      suggestions = suggestions.map(slug => slugify(slug)); // Will also trim, lowercase and remove + signs
    }

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

  Collective.findBySlug = (slug, options = {}, throwIfMissing = true) => {
    if (!slug || slug.length < 1) {
      return Promise.resolve(null);
    }
    return Collective.findOne({
      where: { slug: slug.toLowerCase() },
      ...options,
    }).then(collective => {
      if (!collective && throwIfMissing) {
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
      .getCollectivesByTag(tags, limit, excludeList, minTotalDonationInCents, randomOrder, orderBy, orderDir, offset)
      .then(({ collectives, total }) => {
        debug('getCollectivesSummaryByTag', collectives && collectives.length, 'collectives found');
        return Promise.all(
          collectives.map(collective => {
            debug('getCollectivesSummaryByTag', 'collective', collective.slug);
            return Promise.all([
              collective.getYearlyIncome(),
              queries
                .getMembersWithTotalDonations({ CollectiveId: collective.id }, { role: 'BACKER' })
                .then(users => models.Tier.appendTier(collective, users)),
            ]).then(results => {
              const usersByRole = {};
              const users = results[1];
              users.map(user => {
                usersByRole[user.dataValues.role] = usersByRole[user.dataValues.role] || [];
                usersByRole[user.dataValues.role].push(user);
              });
              const collectiveInfo = collective.card;
              collectiveInfo.yearlyIncome = results[0];
              const backers = usersByRole[roles.BACKER] || [];
              collectiveInfo.backersAndSponsorsCount = backers.length;
              collectiveInfo.membersCount = (usersByRole[roles.ADMIN] || []).length;
              collectiveInfo.sponsorsCount = backers.filter(b => b.tier && b.tier.name.match(/sponsor/i)).length;
              collectiveInfo.backersCount = collectiveInfo.backersAndSponsorsCount - collectiveInfo.sponsorsCount;
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
        ).then(allCollectives => ({
          total,
          collectives: allCollectives,
        }));
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
    Collective.hasMany(m.Tier, { as: 'tiers' });
    Collective.hasMany(m.LegalDocument);
    Collective.hasMany(m.RequiredLegalDocument, { foreignKey: 'HostCollectiveId' });
    Collective.hasMany(m.Collective, { as: 'hostedCollectives', foreignKey: 'HostCollectiveId' });
    Collective.belongsTo(m.Collective, { as: 'HostCollective' });
  };

  Temporal(Collective, Sequelize);

  return Collective;
}
