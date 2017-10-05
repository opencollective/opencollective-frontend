import config from 'config';
import models from '../server/models';
import { capitalize } from '../server/lib/utils';

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
};

// Get all donations that have a subscription
models.Order.findAll({ 
  where: { 
    SubscriptionId: { $ne: null }
  },
  include: [ { model: models.Subscription }]
})
.map(order => {
  if (!order.description.match(/^Donation/)) {
    console.log(`Donation id ${order.id} already processed`);
    return;
  }
  const description = capitalize(`${order.Subscription.interval}ly ${order.description.toLowerCase()}`);
  console.log(`Updating donation #${order.id}'s description to ${description}`);
  return order.update({ description });
})
.then(() => done())
.catch(done);