import { createCollective, editCollective, deleteCollective } from './mutations/collectives';
import { createOrder } from './mutations/orders';
import { createMember, removeMember } from './mutations/members';
import { editTiers } from './mutations/tiers';
import { createExpense, editExpense, updateExpenseStatus, payExpense, deleteExpense } from './mutations/expenses';
import statuses from '../constants/expense_status';

import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  OrderType,
  TierType,
  MemberType,
  ExpenseType
} from './types';

import {
  CollectiveInterfaceType
} from './CollectiveInterface';

import {
  CollectiveInputType,
  CollectiveAttributesInputType,
  OrderInputType,
  TierInputType,
  ExpenseInputType
} from './inputTypes';

const mutations = {
  createCollective: {
    type: CollectiveInterfaceType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) }
    },
    resolve(_, args, req) {
<<<<<<< HEAD
      return createCollective(_, args, req);
=======
 
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
>>>>>>> 4c93a05b1c8d2f1bd214c8dcd6c856013eb6cfdd
    }
  },
  editCollective: {
    type: CollectiveInterfaceType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) }
    },
    resolve(_, args, req) {
<<<<<<< HEAD
      return editCollective(_, args, req);
=======

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
>>>>>>> 4c93a05b1c8d2f1bd214c8dcd6c856013eb6cfdd
    }
  },
  deleteCollective: {
    type: CollectiveInterfaceType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt)}
    },
    resolve(_, args, req) {
      return deleteCollective(_, args, req);
    }
  },
  approveExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args, req) {
      return updateExpenseStatus(req.remoteUser, args.id, statuses.APPROVED);
    }
  },
  rejectExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args, req) {
      return updateExpenseStatus(req.remoteUser, args.id, statuses.REJECTED);
    }
  },
  payExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args, req) {
      return payExpense(req.remoteUser, args.id);
    }
  },
  createExpense: {
    type: ExpenseType,
    args: {
      expense: { type: new GraphQLNonNull(ExpenseInputType) }
    },
    resolve(_, args, req) {
      return createExpense(req.remoteUser, args.expense);
    }
  },
  editExpense: {
    type: ExpenseType,
    args: {
      expense: { type: new GraphQLNonNull(ExpenseInputType) }
    },
    resolve(_, args, req) {
      return editExpense(req.remoteUser, args.expense);
    }
  },
  deleteExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args, req) {
      return deleteExpense(req.remoteUser, args.id);
    }
  },
  editTiers: {
    type: new GraphQLList(TierType),
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      tiers: { type: new GraphQLList(TierInputType) }
    },
    resolve(_, args, req) {
      return editTiers(_, args, req);
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
      return createMember(_, args, req);
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
      return removeMember(_, args, req);
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
      return createOrder(_, args, req);
    }
  }
}

export default mutations;