import models from '../models';
import paymentsLib from '../lib/payments';
import emailLib from '../lib/email';
import Promise from 'bluebird';
import { difference } from 'lodash';
import { hasRole } from '../lib/auth';
import errors from '../lib/errors';
import { pluralize } from '../lib/utils';

import roles from '../constants/roles';

import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  CollectiveType,
  OrderType,
  TierType,
  MemberType
} from './types';

import {
  CollectiveInputType,
  CollectiveAttributesInputType,
  OrderInputType,
  TierInputType,
  UserInputType
} from './inputTypes';

// import { hasRole } from '../middleware/security/auth';
// import {HOST, ADMIN} from '../constants/roles';

const mutations = {
  createCollective: {
    type: CollectiveType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) }
    },
    resolve(_, args, req) {
      let parentCollective;

      const location = args.collective.location;

      const collectiveData = {
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

        // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
        // we force the slug to be of the form of ":parentCollectiveSlug/events/:eventSlug"
        if (collectiveData.type !== 'COLLECTIVE') {
          collectiveData.slug = `${parentCollective.slug}/${collectiveData.type.toLowerCase()}s/${args.collective.slug}`;
        }
        return hasRole(req.remoteUser.id, parentCollective.id, ['ADMIN','HOST', 'BACKER'])
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
        return hasRole(req.remoteUser.id, parentCollective.id, ['ADMIN','HOST'])
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
        return hasRole(req.remoteUser.id, collective.id, ['ADMIN','HOST'])
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
  createMember: {
    type: MemberType,
    args: {
      user: { type: UserInputType },
      collective: { type: CollectiveAttributesInputType },
      role: { type: GraphQLString }
    },
    resolve(_, args, req) {
      let collective;

      const checkPermission = () => {
        if (!req.remoteUser) {
          throw new errors.Unauthorized("You need to be logged in to create a member");
        }
        return hasRole(req.remoteUser.id, collective.id, ['ADMIN','HOST'])
          .then(canEdit => {
            if (!canEdit) throw new errors.Unauthorized(`You need to be logged in as a core contributor or as a host of the ${args.collectiveSlug} collective`);
          })
      }

      return models.Collective.findBySlug(args.collective.slug)
      .then(c => {
        if (!c) throw new Error(`Collective with slug ${args.collective.slug} not found`);
        collective = c;
      })
      .then(() => {
        if (args.role !== roles.FOLLOWER) {
          return checkPermission();
        } else {
          return null;
        }
      })
      // find or create user
      .then(() => models.User.findOne({
        where: {
          $or: {
            email: args.user.email,
            paypalEmail: args.user.email
          }
        }
      }))
      .then(u => u || models.User.create(args.user))
      // add user as member of the collective
      .then((user) => models.Member.create({
        UserId: user.id,
        CollectiveId: collective.id,
        role: args.role.toUpperCase() || roles.FOLLOWER
      }));
    }
  },
  createOrder: {
    type: OrderType,
    args: {
      order: {
        type: OrderInputType
      }
    },
    resolve(_, args, req) {

      let tier, user, event, isPaidTier;
      const order = args.order;
      order.user.email = order.user.email.toLowerCase();

      let collective;
      return models.Tier.findOne({
        where: {
          id: order.tier.id,
        },
        include: [
          { model: models.Collective, where: { slug: order.collective.slug } }
        ]
      })
      .then(t => {
        if (!t || !t.Collective) {
          const forEvent = (order.collective) ? ` for collective slug:${order.collective.slug}` : '';
          throw new Error(`No tier found with tier id: ${order.tier.id}${forEvent}`);
        }
        tier = t;
        event = t.Collective;
        collective = t.Collective;
        isPaidTier = tier.amount > 0;
      })

      // check for available quantity
      .then(() => tier.checkAvailableQuantity(order.quantity))
      .then(enoughQuantityAvailable => enoughQuantityAvailable ? 
            Promise.resolve() : Promise.reject(new Error(`No more tickets left for ${tier.name}`)))

      // make sure if it's a paid tier, we have a payment method attached
      .then(() => isPaidTier && !(order.user.paymentMethod && (order.user.paymentMethod.uuid || order.user.paymentMethod.token)) &&
        Promise.reject(new Error(`This tier requires a payment method`)))
      
      // find or create user
      .then(() => models.User.findOne({
        where: {
          $or: {
            email: order.user.email,
            paypalEmail: order.user.email
          }
        }
      }))
      .then(u => u || models.User.create(order.user))
      .tap(u => user = u)
      .then(() => {
        if (tier.maxQuantityPerUser > 0 && order.quantity > tier.maxQuantityPerUser) {
          Promise.reject(new Error(`You can only buy up to ${tier.maxQuantityPerUser} ${pluralize('ticket', tier.maxQuantityPerUser)} per person`));
        }
      })
      .then(() => {
        return models.Order.create({
          UserId: user.id,
          CollectiveId: event.id,
          TierId: tier.id,
          quantity: order.quantity || 1,
          amount: tier.amount * (order.quantity || 1),
          currency: tier.currency,
          description: order.description,
          processedAt: isPaidTier ? null : new Date
        })
      })
      // process payment, if needed
      .tap((orderInstance) => {
        if (tier.amount > 0) {
          // if the user is trying to reuse an existing credit card,
          // we make sure it belongs to the logged in user.
          let getPaymentMethod;
          if (order.user.paymentMethod.uuid) {
            if (!req.remoteUser) throw new errors.Forbidden("You need to be logged in to be able to use a payment method on file");
            getPaymentMethod = models.PaymentMethod.findOne({ where: { uuid: order.user.paymentMethod.uuid, UserId: req.remoteUser.id }}).then(PaymentMethod => {
              if (!PaymentMethod) throw new errors.NotFound(`You don't have a payment method with that uuid`);
              else return PaymentMethod;
            })
          } else {
            const paymentMethodData = {...order.user.paymentMethod, service: "stripe", UserId: user.id};
            if (!paymentMethodData.save) {
              paymentMethodData.identifier = null;
            }
            getPaymentMethod = models.PaymentMethod.create(paymentMethodData);
          }
          return getPaymentMethod
            .then(paymentMethod => {
              // also sends out email
              const payload = {
                order: orderInstance,
                payment: {
                  paymentMethod,
                  user,
                  amount: orderInstance.amount,
                  interval: tier.interval,
                  currency: orderInstance.currency,
                  description: event ? `${event.name} - ${tier.name}` : tier.name
                }
              };
              return paymentsLib.createPayment(payload);
            })
        } else {
          return emailLib.send(
            'ticket.confirmed',
            user.email,
            { user: user.info,
              collective: collective.info,
              order: orderInstance.info,
              event: event && event.info,
              tier: tier && tier.info
            });
        }
      })
    }
  }
}

export default mutations;