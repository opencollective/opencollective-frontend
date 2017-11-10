import models from '../../models';
import { capitalize, pluralize } from '../../lib/utils';
import { executeOrder } from '../../lib/payments';
import emailLib from '../../lib/email';
import Promise from 'bluebird';
import { types } from '../../constants/collectives';
import roles from '../../constants/roles';

export function createOrder(_, args, req) {
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
    // TODO: using order.interval over Tiers will likely include donations that shouldn't be in tiers. 
    // Need to reevalute with always respecting user choice.

    interval = order.interval;
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
    if (order.user && order.user.email) return models.User.findOrCreateByEmail(order.user.email, { ...order.user, CreatedByUserId: req.remoteUser ? req.remoteUser.id : null });
    if (req.remoteUser) return req.remoteUser;
  })

  // returns the fromCollective
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
      if (req.remoteUser) {
        order.fromCollective.CreatedByUserId = req.remoteUser.id;
      }
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
      CreatedByUserId: req.remoteUser ? req.remoteUser.id : user.id,
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
        .then(() => executeOrder(req.remoteUser || user, orderCreated));
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