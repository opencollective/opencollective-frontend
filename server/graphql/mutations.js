import models from '../models';
import { executeOrder } from '../lib/payments';
import emailLib from '../lib/email';
import Promise from 'bluebird';
import errors from '../lib/errors';
import { capitalize, pluralize } from '../lib/utils';
import slugify from 'slug';
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
 
      if (!args.collective.name) {
        return Promise.reject(new errors.ValidationFailed("collective.name required"));
      }

      let hostCollective, parentCollective, collective;

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
      if (args.collective.HostCollectiveId) {
        promises.push(
          req.loaders
            .collective.findById.load(args.collective.HostCollectiveId)
            .then(hc => {
              if (!hc) return Promise.reject(new Error(`Host collective with id ${args.collective.HostCollectiveId} not found`));
              hostCollective = hc;
              collectiveData.currency = collectiveData.currency || hc.currency;
              if (req.remoteUser.hasRole([roles.ADMIN, roles.HOST, roles.MEMBER], hostCollective.id)) {
                collectiveData.isActive = true;
              }
            })
        );
      }
      if (args.collective.ParentCollectiveId) {
        promises.push(
          req.loaders
            .collective.findById.load(args.collective.ParentCollectiveId)
            .then(pc => {
              if (!pc) return Promise.reject(new Error(`Parent collective with id ${args.collective.ParentCollectiveId} not found`));
              parentCollective = pc;
              // The currency of the new created collective if not specified should be the one of its direct parent or the host (in this order)
              collectiveData.currency = collectiveData.currency || pc.currency;
              if (req.remoteUser.hasRole([roles.ADMIN, roles.HOST, roles.MEMBER], parentCollective.id)) {
                collectiveData.isActive = true;
              }
            })
        );
      }
      return Promise.all(promises)
      .then(() => {
        // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
        // we force the slug to be of the form of `${slug}-${ParentCollectiveId}${collective.type.substr(0,2)}`
        const slug = slugify(args.collective.slug || args.collective.name);
        if (collectiveData.type !== 'COLLECTIVE') {
          collectiveData.slug = `${slug}-${parentCollective.id}${collectiveData.type.substr(0,2)}`.toLowerCase();
          return req.remoteUser.hasRole(['ADMIN', 'HOST', 'BACKER'], parentCollective.id);
        } else {
          return req.remoteUser.hasRole(['ADMIN', 'HOST'], collectiveData.id);
        } // flight number AA2313
      })
      .then(canCreateCollective => {
        if (!canCreateCollective) return Promise.reject(new errors.Unauthorized(`You must be logged in as a member of the ${parentCollective.slug} collective to create an event`));
      })
      .then(() => models.Collective.create(collectiveData))
      .then(c => collective = c)
      .then(() => collective.editTiers(args.collective.tiers))
      .then(() => collective.editMembers(args.collective.members, { CreatedByUserId: req.remoteUser.id }))
      .then(() => collective.editPaymentMethods(args.collective.paymentMethods, { CreatedByUserId: req.remoteUser.id }))
      .then(() => collective)
      .catch(e => {
        let msg;
        switch (e.name) {
          case "SequelizeUniqueConstraintError":
            msg = `The slug ${e.fields.slug.replace(/\-[0-9]+ev$/, '')} is already taken. Please use another name for your ${collectiveData.type.toLowerCase()}.`;
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
      collective: { type: new GraphQLNonNull(CollectiveInputType) }
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

      updatedCollectiveData.type = updatedCollectiveData.type || 'COLLECTIVE';

      if (location.lat) {
        updatedCollectiveData.geoLocationLatLong = {
          type: 'Point',
          coordinates: [ location.lat, location.long ]
        };
      }

      let collective, parentCollective;

      const promises = [
        req.loaders.collective.findById.load(args.collective.id)
          .then(c => {
            if (!c) throw new Error(`Collective with id ${args.collective.id} not found`);
            collective = c;
          })
        ];

      if (args.collective.ParentCollectiveId) {
        promises.push(
          req.loaders
            .collective.findById.load(args.collective.ParentCollectiveId)
            .then(pc => {
              if (!pc) return Promise.reject(new Error(`Parent collective with id ${args.collective.ParentCollectiveId} not found`));
              parentCollective = pc;
            })
        );
      }
      return Promise.all(promises)
      .then(() => {
        if (args.collective.slug && updatedCollectiveData.type === 'EVENT') {
          // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
          // we force the slug to be of the form of `${slug}-${ParentCollectiveId}${collective.type.substr(0,2)}`
          const slug = slugify(args.collective.slug.replace(/(\-[0-9]+[a-z]{2})$/i, '') || args.collective.name);
          updatedCollectiveData.slug = `${slug}-${parentCollective.id}${collective.type.substr(0,2)}`.toLowerCase();
        }
        if (updatedCollectiveData.type === 'EVENT') {
          return (req.remoteUser.id === collective.CreatedByUserId) || req.remoteUser.hasRole(['ADMIN', 'HOST', 'BACKER'], parentCollective.id)
        } else {
          return (req.remoteUser.id === collective.CreatedByUserId) || req.remoteUser.hasRole(['ADMIN', 'HOST'], updatedCollectiveData.id)
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
      .then(() => collective.editMembers(args.collective.members, { CreatedByUserId: req.remoteUser.id }))
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

      return models.Collective.findById(args.id)
        .then(collective => {
          if (!collective) throw new errors.NotFound(`Collective with id ${args.id} not found`);
          if (!req.remoteUser.isAdmin(collective.id) && !req.remoteUser.isAdmin(collective.ParentCollectiveId)) {
            throw new errors.Unauthorized("You need to be logged in as a core contributor or as a host to delete this collective");
          }

          return collective.destroy();
        });
    }
  },
  editTiers: {
    type: new GraphQLList(TierType),
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      tiers: { type: new GraphQLList(TierInputType) }
    },
    resolve(_, args, req) {

      let collective;
      if (!req.remoteUser) {
        throw new errors.Unauthorized("You need to be logged in to edit tiers");
      }

      return req.loaders.collective.findById.load(args.id)
      .then(c => {
        if (!c) throw new Error(`Collective with id ${args.id} not found`);
        collective = c;
        return req.remoteUser.isAdmin(collective.id);
      })
      .then(canEdit => {
        if (!canEdit) throw new errors.Unauthorized(`You need to be logged in as a core contributor or as a host of the ${collective.name} collective`);
      })
      .then(() => collective.editTiers(args.tiers))
    }
  },
  createMember: {
    type: MemberType,
    args: {
      member: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      collective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      role: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve(_, args, req) {
      let collective;

      const checkPermission = () => {
        if (!req.remoteUser) throw new errors.Unauthorized("You need to be logged in to create a member");
        if (req.remoteUser.isAdmin(collective.id)) return true;
        throw new errors.Unauthorized(`You need to be logged in as a core contributor or as a host of the ${collective.slug} collective`);
      }

      return req.loaders.collective.findById.load(args.collective.id)
      .then(c => {
        if (!c) throw new Error(`Collective with id ${args.collective.id} not found`);
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
          return req.loaders.collective.findById.load(args.member.id).then(memberCollective => {
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
      member: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      collective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      role: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve(_, args, req) {
      let membership;

      const checkPermission = () => {
        if (!req.remoteUser) throw new errors.Unauthorized("You need to be logged in to remove a member");
        if (req.remoteUser.id === membership.CreatedByUserId) return true;
        if (req.remoteUser.isAdmin(membership.CollectiveId)) return true;

        throw new errors.Unauthorized(`You need to be logged in as this user or as a core contributor or as a host of the collective id ${membership.CollectiveId}`);
      }

      return models.Member.findOne({
          where: {
            MemberCollectiveId: args.member.id,
            CollectiveId: args.collective.id,
            role: args.role
          }
        })
        .then(m => {
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
        type: new GraphQLNonNull(OrderInputType)
      }
    },
    resolve(_, args, req) {

      let tier, collective, fromCollective, paymentRequired, interval, orderCreated, user;
      const order = args.order;

      if (order.paymentMethod && order.paymentMethod.uuid && !req.remoteUser) {
        throw new Error("You need to be logged in to be able to use a payment method on file");
      }

      if (!order.collective.id) {
        throw new Error("No collective id provided");
      }

      // Check the existence of the recipient Collective
      return req.loaders.collective.findById.load(order.collective.id)
      .then(c => {
        if (!c) {
          throw new Error(`No collective found with id: ${order.collective.id}`);
        }
        collective = c;

        if (!collective.isActive) {
          throw new Error(`This collective is not active`);
        }

        if (order.fromCollective && order.fromCollective.id === collective.id) {
          throw new Error(`Well tried. But no you can't order yourself something ;-)`);
        }

      })
      // Check the existence of the tier
      .then(() => {
        if (!order.tier) return;
        return models.Tier.findById(order.tier.id)
          .then(tier => {
            if (!tier) throw new Error(`No tier found with tier id: ${order.tier.id} for collective slug ${collective.slug}`);
            return tier;
          })
      })
      .then(t => {
        tier = t; // we may not have a tier
        paymentRequired = order.totalAmount > 0 || tier && tier.amount > 0;
        // interval of the tier can only be overridden if it is null (e.g. for custom donations)
        interval = tier && tier.interval || order.interval;
      })

      // make sure that we have a payment method attached if this order requires a payment (totalAmount > 0)
      // or that there is enough funds in the fromCollective
      .then(() => {
        if (paymentRequired) {
          if (!order.paymentMethod || !(order.paymentMethod.uuid || order.paymentMethod.token)) {
            throw new Error(`This tier requires a payment method`);
          }
        }
      })
      
      // check for available quantity of the tier if any
      .then(() => {
        if (!tier) return;
        if (tier.maxQuantityPerUser > 0 && order.quantity > tier.maxQuantityPerUser) {
          Promise.reject(new Error(`You can buy up to ${tier.maxQuantityPerUser} ${pluralize('ticket', tier.maxQuantityPerUser)} per person`));
        }
        return tier.checkAvailableQuantity(order.quantity)
          .then(enoughQuantityAvailable => enoughQuantityAvailable ? 
            Promise.resolve() : Promise.reject(new Error(`No more tickets left for ${tier.name}`)))
      })

      // find or create user, check permissions to set `fromCollective`
      .then(() => {
        if (req.remoteUser) return req.remoteUser;
        return models.User.findOrCreateByEmail(order.user.email, order.user);
      })
      .then(u => {
        user = u;
        if (!order.fromCollective || (!order.fromCollective.id && !order.fromCollective.name)) {
          return {
            id: user.CollectiveId,
            CreatedByUserId: user.id
          };
        }

        // If a `fromCollective` is provided, we check its existence and if the user can create an order on its behalf
        if (order.fromCollective.id) {
          if (!req.remoteUser) throw new Error(`You need to be logged in to create an order for an existing open collective`);
          return req.loaders
            .collective.findById.load(order.fromCollective.id)
            .then(c => {
              if (!c) throw new Error(`From collective id ${order.fromCollective.id} not found`);
              const possibleRoles = [roles.ADMIN, roles.HOST];
              if (c.type === types.ORGANIZATION) {
                possibleRoles.push(roles.MEMBER);
              }
              if (!req.remoteUser.hasRole(possibleRoles, order.fromCollective.id)) {
                throw new Error(`You don't have sufficient permissions to create an order on behalf of the ${c.name} ${c.type.toLowerCase()}`);
              }
              return c;
          });
        } else {
          // Create new organization collective
          return models.Collective.createOrganization(order.fromCollective, user)
        }
      })
      .then(c => fromCollective = c)
      .then(() => {
        const currency = tier && tier.currency || collective.currency;
        const quantity = order.quantity || 1;
        let totalAmount;
        if (tier && tier.amount && !tier.presets) { // if the tier has presets, we can't enforce tier.amount
          totalAmount = tier.amount * quantity;
        } else {
          totalAmount = order.totalAmount; // e.g. the donor tier doesn't set an amount
        }

        const tierNameInfo = (tier && tier.name) ? ` (${tier.name})` : '';
        let defaultDescription;
        if (interval) {
          defaultDescription = capitalize(`${interval}ly donation to ${collective.name}${tierNameInfo}`);
        } else {
          defaultDescription = `Donation to ${collective.name}${tierNameInfo}`
        }

        const orderData = {
          CreatedByUserId: user.id,
          FromCollectiveId: fromCollective.id,
          CollectiveId: collective.id,
          TierId: tier && tier.id,
          quantity,
          totalAmount,
          currency,
          interval,
          description: order.description || defaultDescription,
          publicMessage: order.publicMessage,
          privateMessage: order.privateMessage,
          processedAt: paymentRequired ? null : new Date
        };

        return models.Order.create(orderData)
      })

      // process payment, if needed
      .then(oi => {
        orderCreated = oi;
        orderCreated.interval = interval;
        if (order.paymentMethod && order.paymentMethod.save) {
          order.paymentMethod.CollectiveId = orderCreated.FromCollectiveId;
        }
        if (paymentRequired) {
          return orderCreated
            .setPaymentMethod(order.paymentMethod)
            .then(() => executeOrder(user, orderCreated));
        } else {
          // Free ticket
          const email = (req.remoteUser) ? req.remoteUser.email : args.order.user.email;
          return emailLib.send('ticket.confirmed', email, {
            recipient: { name: fromCollective.name },
            collective: collective.info,
            order: orderCreated.info,
            tier: tier && tier.info
          });
        }
      })
      // make sure we return the latest version of the Order Instance
      .then(() => models.Order.findById(orderCreated.id))
      .catch(e => {
        // helps debugging
        console.error(">>> createOrder mutation error: ", e)
        throw e;
      })
    }
  }
}

export default mutations;