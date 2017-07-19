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
  CollectiveType,
  ResponseType,
  TierType
} from './types';

import {
  CollectiveInputType,
  ResponseInputType,
  TierInputType
} from './inputTypes';

// import { hasRole } from '../middleware/security/auth';
// import {HOST, MEMBER} from '../constants/roles';

const mutations = {
  createCollective: {
    type: CollectiveType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) }
    },
    resolve(_, args, req) {
      let collective, parentCollective;

      const location = args.collective.location;

      const collectiveData = {
        type: 'EVENT',
        ...args.collective,
        locationName: location.name,
        address: location.address
      };

      if (location && location.lat) {
        collectiveData.geoLocationLatLong = { type: 'Point', coordinates: [location.lat, location.long] };
      }

      if (!req.remoteUser) {
        return Promise.reject(new errors.Unauthorized("You need to be logged in to create a collective"));
      }
      return models.Collective.findById(args.collective.ParentCollectiveId)
      .then(pc => {
        if (!pc) return Promise.reject(new Error(`Collective with id ${args.collective.ParentCollectiveId} not found`));
        parentCollective = pc;
        collectiveData.ParentCollectiveId = parentCollective.id;
        return hasRole(req.remoteUser.id, parentCollective.id, ['MEMBER','HOST', 'BACKER'])
      })
      .then(canCreateEvent => {
        if (!canCreateEvent) return Promise.reject(new errors.Unauthorized(`You must be logged in as a member of the ${parentCollective.slug} collective to create an event`));
      })
      .then(() => models.Collective.create(collectiveData))
      .tap(collective => {
        if (args.collective.tiers) {
          args.collective.tiers.map
          return Promise.map(args.collective.tiers, (tier) => {
            tier.CollectiveId = collective.id;
            tier.currency = tier.currency || collective.currency;
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
  editCollective: {
    type: CollectiveType,
    args: {
      collective: { type: CollectiveInputType }
    },
    resolve(_, args, req) {

      const location = args.collective.location;

      const updatedCollectiveData = {
        ...args.collective,
        locationName: location.name,
        address: location.address
      };
      if (location.lat) {
        updatedCollectiveData.geoLocationLatLong = {type: 'Point', coordinates: [location.lat, location.long]};
      }

      let collective, parentCollective;
      if (!req.remoteUser) {
        throw new errors.Unauthorized("You need to be logged in to edit a collective");
      }
      return models.Collective.findById(args.collective.ParentCollectiveId)
      .then(pc => {
        if (!pc) throw new Error(`Collective with id ${args.collective.ParentCollectiveId} not found`);
        parentCollective = pc;
        return hasRole(req.remoteUser.id, parentCollective.id, ['MEMBER','HOST'])
      })
      .then(canEditCollective => {
        if (!canEditCollective) throw new errors.Unauthorized("You need to be logged in as a core contributor or as a host to edit this collective");
      })
      .then(() => models.Collective.findById(args.collective.id))
      .then(c => {
        if (!c) throw new Error(`Collective with id ${args.collective.id} not found`);
        collective = c;
        return collective;
      })
      .then(collective => collective.update(updatedCollectiveData))
      .then(collective => collective.getTiers())
      .then(tiers => {
        if (args.collective.tiers) {
          // remove the tiers that are not present anymore in the updated collective
          const diff = difference(tiers.map(t => t.id), args.collective.tiers.map(t => t.id));
          return models.Tier.update({ deletedAt: new Date }, { where: { id: { $in: diff }}})
        }
      })
      .then(() => {
        if (args.collective.tiers) {
          return Promise.map(args.collective.tiers, (tier) => {
            if (tier.id) {
              return models.Tier.update(tier, { where: { id: tier.id }});
            } else {
              tier.CollectiveId = collective.id;
              tier.currency = tier.currency || collective.currency;
              return models.Tier.create(tier);  
            }
          });
        }
      })
      .then(() => collective);
    }
  },
  deleteCollective: {
    type: CollectiveType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt)}
    },
    resolve(_, args, req) {

      if (!req.remoteUser) {
        throw new errors.Unauthorized("You need to be logged in to delete a collective");
      }

      return models.Collective
        .findById(args.id)
        .then(collective => {
          if (!collective) throw new errors.NotFound(`Collective with id ${args.id} not found`);
          return collective
            .canEdit(req.remoteUser)
            .then(canEditCollective => {
              if (!canEditCollective) throw new errors.Unauthorized("You need to be logged in as a core contributor or as a host to edit this collective");
              return collective.destroy();
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
      return models.Collective.findOne({ where: { slug: args.collectiveSlug } })
      .then(c => {
        if (!c) throw new Error(`Collective with slug ${args.collectiveSlug} not found`);
        collective = c;
        return hasRole(req.remoteUser.id, collective.id, ['MEMBER','HOST'])
      })
      .then(canEdit => {
        if (!canEdit) throw new errors.Unauthorized(`You need to be logged in as a core contributor or as a host of the ${args.collectiveSlug} collective`);
      })
      .then(() => collective.getTiers())
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
            tier.CollectiveId = collective.id;
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
        return models.Collective.findBySlug(response.collective.slug)
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
          CollectiveId: event.id,
          confirmedAt: new Date(),
          status: response.status,
          description: response.description
        }));
      }

      const recordYes = () => {
        let collective;
        return models.Tier.findOne({
          where: {
            id: response.tier.id,
          },
          include: [
            { model: models.Collective, where: { slug: response.collective.slug } }
          ]
        })
        .then(t => {
          if (!t || !t.Collective) {
            const forEvent = (response.collective) ? ` for collective slug:${response.collective.slug}` : '';
            throw new Error(`No tier found with tier id: ${response.tier.id}${forEvent}`);
          }
          tier = t;
          event = t.Collective;
          collective = t.Collective;
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
          CollectiveId: event.id,
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
                  collective,
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
                collective: collective.info,
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