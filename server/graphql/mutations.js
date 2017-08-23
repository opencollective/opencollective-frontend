import models from '../models';
import paymentsLib from '../lib/payments';
import emailLib from '../lib/email';
import Promise from 'bluebird';
import { hasRole } from '../lib/auth';
import errors from '../lib/errors';
import { capitalize, pluralize } from '../lib/utils';

import roles from '../constants/roles';
import { types } from '../constants/collectives';

import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  OrderType,
  TierType,
  MemberType
} from './types';

import {
  CollectiveInterfaceType
} from './CollectiveInterface';

import {
  CollectiveInputType,
  CollectiveAttributesInputType,
  OrderInputType,
  TierInputType
} from './inputTypes';

// import { hasRole } from '../middleware/security/auth';
// import {HOST, ADMIN} from '../constants/roles';

const mutations = {
  createCollective: {
    type: CollectiveInterfaceType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) }
    },
    resolve(_, args, req) {
 
      if (!req.remoteUser) {
        return Promise.reject(new errors.Unauthorized("You need to be logged in to create a collective"));
      }
 
      if (!args.collective.slug) {
        return Promise.reject(new errors.ValidationFailed("collective.slug required"));
      }
 
      if (!args.collective.name) {
        return Promise.reject(new errors.ValidationFailed("collective.name required"));
      }

      let parentCollective;

      const location = args.collective.location;

      const collectiveData = {
        ...args.collective,
        locationName: location.name,
        address: location.address,
        CreatedByUserId: req.remoteUser.id
      };

      if (location && location.lat) {
        collectiveData.geoLocationLatLong = { type: 'Point', coordinates: [location.lat, location.long] };
      }

      const promises = [];
      if (args.collective.ParentCollectiveId) {
        promises.push(
          models.Collective
            .findById(args.collective.ParentCollectiveId)
            .then(pc => {
              if (!pc) return Promise.reject(new Error(`Parent collective with id ${args.collective.ParentCollectiveId} not found`));
              parentCollective = pc;
            })
        );
      }
      return Promise.all(promises)
      .then(() => {
        // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
        // we force the slug to be of the form of ":parentCollectiveSlug/events/:eventSlug"
        if (collectiveData.type !== 'COLLECTIVE') {
          collectiveData.slug = `${parentCollective.slug}/${collectiveData.type.toLowerCase()}s/${args.collective.slug.replace(/.*\//,'')}`;
          return hasRole(req.remoteUser.CollectiveId, parentCollective.id, ['ADMIN', 'HOST', 'BACKER'])
        } else {
          return hasRole(req.remoteUser.CollectiveId, collectiveData.id, ['ADMIN', 'HOST'])
        }
      })
      .then(canCreateCollective => {
        if (!canCreateCollective) return Promise.reject(new errors.Unauthorized(`You must be logged in as a member of the ${parentCollective.slug} collective to create an event`));
      })
      .then(() => models.Collective.create(collectiveData))
      .tap(collective => collective.editTiers(args.collective.tiers))
      .tap(collective => collective.editMembers(args.collective.members))
      .tap(collective => collective.editPaymentMethods(args.collective.paymentMethods, { CreatedByUserId: req.remoteUser.id }))
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
    type: CollectiveInterfaceType,
    args: {
      collective: { type: CollectiveInputType }
    },
    resolve(_, args, req) {

      if (!req.remoteUser) {
        throw new errors.Unauthorized("You need to be logged in to edit a collective");
      }

      if (!args.collective.id) {
        return Promise.reject(new errors.ValidationFailed("collective.id required"));
      }

      const location = args.collective.location || {};

      const updatedCollectiveData = {
        ...args.collective,
        locationName: location.name,
        address: location.address,
        LastEditedByUserId: req.remoteUser.id
      };

      if (location.lat) {
        updatedCollectiveData.geoLocationLatLong = {
          type: 'Point',
          coordinates: [ location.lat, location.long ]
        };
      }

      let collective, parentCollective;

      const promises = [
        models.Collective
          .findById(args.collective.id)
          .then(c => {
            if (!c) throw new Error(`Collective with id ${args.collective.id} not found`);
            collective = c;
          })
        ];

      if (args.collective.ParentCollectiveId) {
        promises.push(
          models.Collective
            .findById(args.collective.ParentCollectiveId)
            .then(pc => {
              if (!pc) return Promise.reject(new Error(`Parent collective with id ${args.collective.ParentCollectiveId} not found`));
              parentCollective = pc;
            })
        );
      }
      return Promise.all(promises)
      .then(() => {
        // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
        // we force the slug to be of the form of ":parentCollectiveSlug/events/:eventSlug"
        if (updatedCollectiveData.type === 'EVENT') {
          updatedCollectiveData.slug = `${parentCollective.slug}/events/${updatedCollectiveData.slug.replace(/.*\//,'')}`;
          return (req.remoteUser.id === collective.CreatedByUserId) || hasRole(req.remoteUser.CollectiveId, parentCollective.id, ['ADMIN', 'HOST', 'BACKER'])
        } else {
          return (req.remoteUser.id === collective.CreatedByUserId) || hasRole(req.remoteUser.CollectiveId, updatedCollectiveData.id, ['ADMIN', 'HOST'])
        }
      })
      .then(canEditCollective => {
        if (!canEditCollective) {
          let errorMsg;
          switch (updatedCollectiveData.type) { 
            case types.EVENT:
              errorMsg = `You must be logged in as the creator of this Event or as an admin of the ${parentCollective.slug} collective to edit this Event Collective`;
              break;
            
            case types.USER:
              errorMsg = `You must be logged in as ${updatedCollectiveData.name} to edit this User Collective`;            
              break;

            default:
              errorMsg = `You must be logged in as an admin or as the host of this ${updatedCollectiveData.type.toLowerCase()} collective to edit it`;            
          }
          return Promise.reject(new errors.Unauthorized(errorMsg));
        }
      })
      .then(() => collective.update(updatedCollectiveData))
      .then(() => collective.editTiers(args.collective.tiers))
      .then(() => collective.editMembers(args.collective.members))
      .then(() => collective.editPaymentMethods(args.collective.paymentMethods, { CreatedByUserId: req.remoteUser.id }))
      .then(() => collective);
    }
  },
  deleteCollective: {
    type: CollectiveInterfaceType,
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
        return hasRole(req.remoteUser.CollectiveId, collective.id, ['ADMIN','HOST'])
      })
      .then(canEdit => {
        if (!canEdit) throw new errors.Unauthorized(`You need to be logged in as a core contributor or as a host of the ${args.collectiveSlug} collective`);
      })
      .then(() => collective.editTiers(args.tiers))
    }
  },
  createMember: {
    type: MemberType,
    args: {
      member: { type: CollectiveAttributesInputType },
      collective: { type: CollectiveAttributesInputType },
      role: { type: GraphQLString }
    },
    resolve(_, args, req) {
      let collective;

      const checkPermission = () => {
        if (!req.remoteUser) {
          throw new errors.Unauthorized("You need to be logged in to create a member");
        }
        return hasRole(req.remoteUser.CollectiveId, collective.id, ['ADMIN','HOST'])
          .then(canEdit => {
            if (!canEdit) throw new errors.Unauthorized(`You need to be logged in as a core contributor or as a host of the ${args.collective.slug} collective`);
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
      .then(() => {
        if (args.member.id) {
          return models.Collective.findById(args.member.id).then(memberCollective => {
            return {
              id: memberCollective.CreatedByUserId,
              CollectiveId: memberCollective.id
            }
          });
        }
      })
      .then(u => u || models.User.findOrCreateByEmail(args.member.email, args.member))
      // add user as member of the collective
      .then((user) => models.Member.create({
        CreatedByUserId: user.id,
        MemberCollectiveId: user.CollectiveId,
        CollectiveId: collective.id,
        role: args.role.toUpperCase() || roles.FOLLOWER
      }));
    }
  },
  removeMember: {
    type: MemberType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args, req) {
      let membership;

      const checkPermission = () => {
        if (!req.remoteUser) {
          throw new errors.Unauthorized("You need to be logged in to remove a member");
        }
        if (req.remoteUser.id === membership.CreatedByUserId) return Promise.resolve(true);
        return hasRole(req.remoteUser.CollectiveId, membership.CollectiveId, ['ADMIN', 'HOST'])
          .then(canEdit => {
            if (!canEdit) throw new errors.Unauthorized(`You need to be logged in as this user or as a core contributor or as a host of the collective id ${membership.CollectiveId}`);
          })
      }

      return models.Member.findById(args.id)
      .tap(m => {
        if (!m) throw new errors.NotFound("Member not found");
        membership = m;
      })
      .then(checkPermission)
      .then(() => {
        return membership.destroy();
      })
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

      let tier, collective, fromCollective, paymentRequired, interval;
      const order = args.order;
      return models.Collective.findBySlug(order.toCollective.slug)
      .then(c => {
        if (!c) {
          throw new Error(`No collective found with slug: ${order.toCollective.slug}`);
        }
        collective = c;
      })
      .then(() => models.Tier.getOrFind({
        id: order.tier.id,
        amount: order.totalAmount / (order.quantity || 1),
        interval: order.interval,
        CollectiveId: collective.id
      }))
      .then(t => {
        if (!t) {
          throw new Error(`No tier found with tier id: ${order.tier.id} for collective slug ${collective.slug}`);
        }
        tier = t;
        paymentRequired = order.totalAmount > 0;
        // interval of the tier can only be overridden if it is null (e.g. for custom donations)
        interval = tier.interval || order.interval;
      })

      // check for available quantity
      .then(() => tier.checkAvailableQuantity(order.quantity))
      .then(enoughQuantityAvailable => enoughQuantityAvailable ? 
            Promise.resolve() : Promise.reject(new Error(`No more tickets left for ${tier.name}`)))

      // make sure that we have a payment method attached if this order requires a payment (totalAmount > 0)
      .then(() => paymentRequired && !(order.paymentMethod && (order.paymentMethod.uuid || order.paymentMethod.token)) &&
        Promise.reject(new Error(`This tier requires a payment method`)))
      
      // find or create fromCollective
      .then(() => {
        if (order.fromCollective && order.fromCollective.id) {
          if (!req.remoteUser) throw new Error(`You need to be logged in to create an order for an existing open collective account`);
          return hasRole(req.remoteUser.CollectiveId, order.fromCollective.id, ['ADMIN', 'HOST']).then(canEdit => {
            if (!canEdit) throw new Error(`You need to be logged in as an admin of the collective id ${order.fromCollective.id}`);
            return models.Collective.findById(order.fromCollective.id).tap(c => {
              if (!c) throw new Error(`From collective id ${order.fromCollective.id} not found`);
            });
          });
        } else {
          return models.User.findOrCreateByEmail(order.user.email, order.user).then(u => {
            return {
              id: u.CollectiveId,
              CreatedByUserId: u.id
            };
          });
        }
      })
      .then(c => fromCollective = c)
      .then(() => {
        if (tier.maxQuantityPerUser > 0 && order.quantity > tier.maxQuantityPerUser) {
          Promise.reject(new Error(`You can buy up to ${tier.maxQuantityPerUser} ${pluralize('ticket', tier.maxQuantityPerUser)} per person`));
        }
      })
      .then(() => {
        const currency = tier.currency || collective.currency;
        const quantity = order.quantity || 1;
        let totalAmount;
        if (tier.amount) {
          totalAmount = tier.amount * quantity;
        } else {
          totalAmount = order.totalAmount; // e.g. the donor tier doesn't set an amount
        }

        const tierNameInfo = (tier && tier.name) ? ` (${tier.name})` : '';
        let description;
        if (interval) {
          description = capitalize(`${interval}ly donation to ${collective.name}${tierNameInfo}`);
        } else {
          description = `Donation to ${collective.name}${tierNameInfo}`
        }

        const orderData = {
          CreatedByUserId: fromCollective.CreatedByUserId,
          FromCollectiveId: fromCollective.id,
          ToCollectiveId: collective.id,
          TierId: tier.id,
          quantity,
          totalAmount,
          currency,
          description: order.description || description,
          publicMessage: order.publicMessage,
          privateMessage: order.privateMessage,
          processedAt: paymentRequired ? null : new Date
        };
        return models.Order.create(orderData)
      })
      // process payment, if needed
      .tap((orderInstance) => {
        if (orderInstance.totalAmount > 0) {
          // if the user is trying to reuse an existing credit card,
          // we make sure it belongs to the logged in user.
          let getPaymentMethod;
          if (order.paymentMethod.uuid) {
            if (!req.remoteUser) throw new errors.Forbidden("You need to be logged in to be able to use a payment method on file");
            getPaymentMethod = models.PaymentMethod.findOne({
              where: {
                uuid: order.paymentMethod.uuid,
                CollectiveId: req.remoteUser.CollectiveId
              }
            }).then(PaymentMethod => {
              if (!PaymentMethod) throw new errors.NotFound(`You don't have a payment method with that uuid`);
              else return PaymentMethod;
            })
          } else {
            const paymentMethodData = {
              ...order.paymentMethod,
              service: "stripe",
              CreatedByUserId: fromCollective.CreatedByUserId,
              CollectiveId: orderInstance.FromCollectiveId
            };
            if (!paymentMethodData.save) {
              paymentMethodData.identifier = null;
            }
            getPaymentMethod = models.PaymentMethod.create(paymentMethodData);
          }
          return getPaymentMethod
            .tap(paymentMethod => {
              orderInstance.PaymentMethodId = paymentMethod.id;
              return orderInstance.save();
            })
            .then(paymentMethod => {
              // also sends out email
              const payload = {
                order: orderInstance,
                payment: {
                  paymentMethod,
                  amount: orderInstance.totalAmount,                  
                  interval, 
                  currency: orderInstance.currency
                }
              };
              return paymentsLib.createPayment(payload);
            })
        } else {
          // Free ticket
          const email = (req.remoteUser) ? req.remoteUser.email : args.order.user.email;
          return emailLib.send('ticket.confirmed', email, {
            recipient: { name: fromCollective.name },
            collective: collective.info,
            order: orderInstance.info,
            tier: tier && tier.info
          });
        }
      })
      // make sure we return the latest version of the Order Instance
      .then(orderInstance => models.Order.findById(orderInstance.id))
      .catch(e => {
        // helps debugging
        console.error(">>> createOrder mutation error: ", e)
        throw e;
      })
    }
  }
}

export default mutations;