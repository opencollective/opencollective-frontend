import models from '../../../models';
import { dispatchFunds, getNextDispatchingDate, needsDispatching } from '../../../lib/backyourstack/dispatcher';

import status from '../../../constants/order_status';

export async function dispatchOrder(orderId) {
  const order = await models.Order.findByPk(orderId);
  if (!order) {
    throw new Error(`No order with id ${orderId} found`);
  }

  if (!order.data.customData || !order.data.customData.jsonUrl) {
    throw new Error('Requires customData jsonUrl to dispatch order');
  }

  const subscription = await models.Subscription.findByPk(order.SubscriptionId);
  if (!subscription.isActive || order.status !== status.ACTIVE) {
    throw new Error(`Order was created but not active`);
  }

  if (subscription.data && !needsDispatching(subscription.data.nextDispatchDate)) {
    throw new Error(`Order is not up for dispatching, next dispatching date is ${subscription.data.nextDispatchDate}`);
  }

  let dispatchedOrders;
  try {
    dispatchedOrders = await dispatchFunds(order);
  } catch (err) {
    console.error(err);
    throw new Error(`Unable to dispatch funds to collectves.`);
  }

  if (dispatchedOrders) {
    const currentDispatchDate = (subscription.data && subscription.data.nextDispatchDate) || new Date();
    subscription.data = {
      nextDispatchDate: getNextDispatchingDate(subscription.interval, currentDispatchDate),
    };

    await subscription.save();
  }

  return dispatchedOrders;
}
