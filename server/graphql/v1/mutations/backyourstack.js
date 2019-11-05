import moment from 'moment';
import models from '../../../models';
import { dispatch, needsDispatching } from '../../../lib/backyourstack/dispatcher';

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
    const nextDispatchDate = moment(subscription.data.nextDispatchDate).format('ll');
    throw new Error(
      `Your BackYourStack order is already complete for this month. The next dispatch of funds will be on ${nextDispatchDate}`,
    );
  }
  // Funds are dispatched asynchronously, we're not waiting here on purpose
  dispatch(order, subscription);
  return { dispatching: true };
}
