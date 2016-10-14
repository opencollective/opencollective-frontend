import config from 'config';
import models from '../server/models';
import { capitalize } from '../server/lib/utils';

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
};

// Get all donations that have a subscription
models.Donation.findAll({ 
  where: { 
    SubscriptionId: { $ne: null }
  },
  include: [ { model: models.Subscription }]
})
.map(donation => {
  if (!donation.title.match(/^Donation/)) {
    console.log(`Donation id ${donation.id} already processed`);
    return;
  }
  const title = capitalize(`${donation.Subscription.interval}ly ${donation.title.toLowerCase()}`);
  console.log(`Updating donation #${donation.id}'s title to ${title}`);
  return donation.update({ title });
})
.then(() => done())
.catch(done);