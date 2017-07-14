import models from '../models';
import paymentsLib from '../lib/payments';
import emailLib from '../lib/email';
import responseStatus from '../constants/response_status';
import Promise from 'bluebird';
import { difference } from 'lodash';
import { hasRole } from '../lib/auth';
import errors from '../lib/errors';
import { pluralize } from '../lib/utils';

import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  EventType,
  ResponseType,
  TierType
} from './types';

import {
  EventInputType,
  ResponseInputType,
  TierInputType
} from './inputTypes';

// import { hasRole } from '../middleware/security/auth';
// import {HOST, MEMBER} from '../constants/roles';

const mutations = {
  createEvent: {
    type: EventType,
    args: {
      event: { type: new GraphQLNonNull(EventInputType) }
    },
    resolve(_, args, req) {
      let group;

      const location = args.event.location;

      const eventData = {
        ...args.event,
        locationName: location.name,
        address: location.address,
        geoLocationLatLong: {type: 'Point', coordinates: [location.lat, location.long]}
      };

      if (!req.remoteUser) {
        return Promise.reject(new errors.Unauthorized("You need to be logged in to create an event"));
      }
      return models.Group.findOne({ where: { slug: args.event.collective.slug } })
      .then(g => {
        if (!g) return Promise.reject(new Error(`Collective with slug ${args.event.collective.slug} not found`));
        group = g;
        eventData.GroupId = group.id;
        return hasRole(req.remoteUser.id, group.id, ['MEMBER','HOST', 'BACKER'])
      })
      .then(canCreateEvent => {
        if (!canCreateEvent) return Promise.reject(new errors.Unauthorized("You must be logged in as a member of the collective to create an event"));
      })
      .then(() => models.Event.create(eventData))
      .tap(event => {
        if (args.event.tiers) {
          args.event.tiers.map
          return Promise.map(args.event.tiers, (tier) => {
            tier.EventId = event.id;
            tier.currency = tier.currency || group.currency;
            return models.Tier.create(tier);
          })
        }
      })
      .catch(e => {
        let msg;
        switch (e.name) {
          case "SequelizeUniqueConstraintError":
            msg = `The slug ${e.fields.slug} is already taken. Please use another one.`
            break;
          default:
            msg = e.message;
            break;
        }
        throw new Error(msg);
      })
    }
  },
  editEvent: {
    type: EventType,
    args: {
      event: { type: EventInputType }
    },
    resolve(_, args, req) {

      const location = args.event.location;

      const updatedEventData = {
        ...args.event,
        locationName: location.name,
        address: location.address
      };
      if (location.lat) {
        updatedEventData.geoLocationLatLong = {type: 'Point', coordinates: [location.lat, location.long]};
      }

      let group, event;
      if (!req.remoteUser) {
        throw new errors.Unauthorized("You need to be logged in to edit an event");
      }
      return models.Group.findOne({ where: { slug: args.event.collective.slug } })
      .then(g => {
        if (!g) throw new Error(`Collective with slug ${args.event.collective.slug} not found`);
        group = g;
        return hasRole(req.remoteUser.id, group.id, ['MEMBER','HOST'])
      })
      .then(canEditEvent => {
        if (!canEditEvent) throw new errors.Unauthorized("You need to be logged in as a core contributor or as a host to edit this event");
      })
      .then(() => models.Event.findById(args.event.id))
      .then(ev => {
        if (!ev) throw new Error(`Event with id ${args.event.id} not found`);
        event = ev;
        return event;
      })
      .then(event => event.update(updatedEventData))
      .then(event => event.getTiers())
      .then(tiers => {
        if (args.event.tiers) {
          // remove the tiers that are not present anymore in the updated event
          const diff = difference(tiers.map(t => t.id), args.event.tiers.map(t => t.id));
          return models.Tier.update({ deletedAt: new Date }, { where: { id: { $in: diff }}})
        }
      })
      .then(() => {
        if (args.event.tiers) {
          return Promise.map(args.event.tiers, (tier) => {
            if (tier.id) {
              return models.Tier.update(tier, { where: { id: tier.id }});
            } else {
              tier.EventId = event.id;
              tier.currency = tier.currency || group.currency;
              return models.Tier.create(tier);  
            }
          });
        }
      })
      .then(() => event);
    }
  },
  deleteEvent: {
    type: EventType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt)}
    },
    resolve(_, args, req) {

      if (!req.remoteUser) {
        throw new errors.Unauthorized("You need to be logged in to delete an event");
      }

      return models.Event
        .findById(args.id)
        .then(event => {
          if (!event) throw new errors.NotFound(`Event with id ${args.id} not found`);
          return event
            .canEdit(req.remoteUser)
            .then(canEditEvent => {
              if (!canEditEvent) throw new errors.Unauthorized("You need to be logged in as a core contributor or as a host to edit this event");
              return event.destroy();
            });
        });
    }
  },
  editTiers: {
    type: new GraphQLList(TierType),
    args: {
      collectiveSlug: { type: new GraphQLNonNull(GraphQLString) },
      tiers: { type: new GraphQLList(TierInputType) }
    },
    resolve(_, args, req) {

      let collective;
      if (!req.remoteUser) {
        throw new errors.Unauthorized("You need to be logged in to edit tiers");
      }
      return models.Group.findOne({ where: { slug: args.collectiveSlug } })
      .then(c => {
        if (!c) throw new Error(`Collective with slug ${args.collectiveSlug} not found`);
        collective = c;
        return hasRole(req.remoteUser.id, collective.id, ['MEMBER','HOST'])
      })
      .then(canEdit => {
        if (!canEdit) throw new errors.Unauthorized(`You need to be logged in as a core contributor or as a host of the ${args.collectiveSlug} collective`);
      })
      .then(() => collective.getTiers({ where: { EventId: { $eq: null }}}))
      .then(tiers => {
        // remove the tiers that are not present anymore in the updated collective
        const diff = difference(tiers.map(t => t.id), args.tiers.map(t => t.id));
        return models.Tier.update({ deletedAt: new Date }, { where: { id: { $in: diff }}})
      })
      .then(() => {
        return Promise.map(args.tiers, (tier) => {
          if (tier.id) {
            return models.Tier.update(tier, { where: { id: tier.id }});
          } else {
            tier.GroupId = collective.id;
            tier.currency = tier.currency || collective.currency;
            return models.Tier.create(tier);
          }
        });
      })
      .then(() => collective.getTiers());
    }
  },
  createResponse: {
    type: ResponseType,
    args: {
      response: {
        type: ResponseInputType
      }
    },
    resolve(_, args, req) {

      let tier, user, event, responseModel, isPaidTier;
      const response = args.response;
      response.user.email = response.user.email.toLowerCase();

      const recordInterested = () => {
        return models.Event.getBySlug(response.collective.slug, response.event.slug)
        .then(e => event = e)
        // find or create user
        .then(() => models.User.findOne({
          where: {
            $or: {
              email: response.user.email,
              paypalEmail: response.user.email
            }
          }
        }))
        .then(u => u || models.User.create(response.user))
        .tap(u => user = u)

        // create response
        .then(() => models.Response.create({
          UserId: user.id,
          GroupId: event.Group.id,
          EventId: event.id,
          confirmedAt: new Date(),
          status: response.status,
          description: response.description
        }));
      }

      const recordYes = () => {
        let group;
        const include = [{
          model: models.Group,
          where: {
            slug: response.collective.slug
          }
        }];
        if (response.event) {
          include.push({
            model: models.Event,
            where: {
              slug: response.event.slug
            }
          });
        }
        return models.Tier.findOne({
          where: {
            id: response.tier.id,
          },
          include
        })
        .then(t => {
          if (!t) {
            const forEvent = (response.event) ? ` for event slug:${response.event.slug}` : '';
            throw new Error(`No tier found with tier id: ${response.tier.id}${forEvent} in collective slug:${response.collective.slug}`);
          }
          tier = t;
          event = t.Event;
          group = t.Group;
          isPaidTier = tier.amount > 0;
        })

        // check for available quantity
        .then(() => tier.checkAvailableQuantity(response.quantity))
        .then(enoughQuantityAvailable => enoughQuantityAvailable ? 
              Promise.resolve() : Promise.reject(new Error(`No more tickets left for ${tier.name}`)))

        // make sure if it's a paid tier, we have a payment method attached
        .then(() => isPaidTier && !(response.user.paymentMethod && (response.user.paymentMethod.uuid || response.user.paymentMethod.token)) &&
          Promise.reject(new Error(`This tier requires a payment method`)))
        
        // find or create user
        .then(() => models.User.findOne({
          where: {
            $or: {
              email: response.user.email,
              paypalEmail: response.user.email
            }
          }
        }))
        .then(u => u || models.User.create(response.user))
        .tap(u => user = u)
        .then(() => {
          if (tier.maxQuantityPerUser > 0 && response.quantity > tier.maxQuantityPerUser) {
            Promise.reject(new Error(`You can only buy up to ${tier.maxQuantityPerUser} ${pluralize('ticket', tier.maxQuantityPerUser)} per person`));
          }
        })
        // create response
        .then(() => models.Response.create({
          UserId: user.id,
          GroupId: group.id,
          EventId: event && event.id,
          TierId: tier.id,
          confirmedAt: isPaidTier ? null : new Date(),
          quantity: response.quantity || 0,
          status: response.status,
          description: response.description
        }))
        .tap(rm => responseModel = rm)

        // process payment, if needed
        .then(responseModel => {
          if (tier.amount > 0) {
            // if the user is trying to reuse an existing credit card,
            // we make sure it belongs to the logged in user.
            let getPaymentMethod;
            if (response.user.paymentMethod.uuid) {
              if (!req.remoteUser) throw new errors.Forbidden("You need to be logged in to be able to use a payment method on file");
              getPaymentMethod = models.PaymentMethod.findOne({ where: { uuid: response.user.paymentMethod.uuid, UserId: req.remoteUser.id }}).then(PaymentMethod => {
                if (!PaymentMethod) throw new errors.NotFound(`You don't have a payment method with that uuid`);
                else return PaymentMethod;
              })
            } else {
              const paymentMethodData = {...response.user.paymentMethod, service: "stripe", UserId: user.id};
              if (!paymentMethodData.save) {
                paymentMethodData.identifier = null;
              }
              getPaymentMethod = models.PaymentMethod.create(paymentMethodData);
            }
            return getPaymentMethod
              .then(paymentMethod => {
                // also sends out email 
                return paymentsLib.createPayment({
                  user,
                  group,
                  response: responseModel,
                  payment: {
                    paymentMethod,
                    user,
                    amount: tier.amount * (responseModel.quantity || 1),
                    interval: tier.interval,
                    currency: tier.currency,
                    description: event ? `${event.name} - ${tier.name}` : tier.name
                  }
                })
              })
          } else {
            // only send out email if no payment
            return emailLib.send(
              'ticket.confirmed',
              user.email,
              { user: user.info,
                group: group.info,
                response: responseModel.info,
                event: event && event.info,
                tier: tier && tier.info
              });
          }
        })
        .then(() => Promise.resolve(responseModel))
      }

      switch (response.status) {
        case responseStatus.INTERESTED:
          return recordInterested();

        default:
          return recordYes();
      }

    }
  }
}

export default mutations;