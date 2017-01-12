/*
 * Populate paymentMethod in Donation Table
 */

import models from '../server/models';


const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

function run() {
  let updatedCount = 0;
  // get all donations that don't have a PaymentMethod
  return models.Donation.findAll({where: {PaymentMethodId: null}})
  .each(donation => {
    // for each donation, find a transaction and copy over PaymentMethod
    return models.Transaction.findAll({where: {DonationId: donation.id}})
    .then(transactions => {
      if (transactions && transactions.length >= 1 && transactions[0].PaymentMethodId != null) {
        updatedCount += 1;
        console.log(`Setting DonationId: ${donation.id} with PaymentMethodId: ${transactions[0].PaymentMethodId}`);
        donation.PaymentMethodId = transactions[0].PaymentMethodId;
        return donation.save();
      } else {
        console.log(`Didn't update DonationId: ${donation.id}`);
      }
    })
  })
  .then(() => console.log('Donation rows updated: ', updatedCount))
  .then(() => done())
  .catch(done)
}

run();