#!/usr/bin/env ./node_modules/.bin/babel-node
import { get, last } from 'lodash';
import '../server/env';
import { listCharges } from '../server/paymentProviders/stripe/gateway';
import models from '../server/models';

/**
  Usage: ./scripts/diff-stripe-transactions.js [NB_CHARGES_TO_CHECK=100]
*/

const NB_CHARGES_TO_CHECK = parseInt(process.argv[2]) || 100;
const NB_CHARGES_PER_QUERY = 100; // Max allowed by Stripe
const NB_PAGES = NB_CHARGES_TO_CHECK / NB_CHARGES_PER_QUERY;

async function checkCharge(charge) {
  if (charge.failure_code) {
    // Ignore failed transaction
    return;
  }

  let transaction = await models.Transaction.findOne({
    where: { data: { charge: { id: charge.id } } },
    order: [['id', 'DESC']],
    // The JOIN is only here to optimize the query as searching in a JSON for thousands
    // of transaction can be pretty expensive.
    include: [
      {
        model: models.PaymentMethod,
        as: 'PaymentMethod',
        required: true,
        where: {
          customerId: charge.customer,
          service: 'stripe',
        },
      },
    ],
  });

  if (!transaction) {
    console.warn(
      `...Did not find any transaction for ${charge.id} matching the customer_id. Starting extensive search...`,
    );

    // This is an expensive query, we only run it if the above fails
    transaction = await models.Transaction.findOne({
      where: { data: { charge: { id: charge.id } } },
      order: [['id', 'DESC']],
    });

    if (!transaction) {
      console.error(`🚨️ Missing transaction for stripe charge ${charge.id}`);
    }
  }
}

async function main() {
  let lastChargeId;
  let totalAlreadyChecked = 0;

  console.info(`Starting the diff of Stripe VS Transactions for the latest ${NB_CHARGES_TO_CHECK} charges`);
  for (let pageNum = 0; pageNum < NB_PAGES; pageNum++) {
    // Log the current page
    const nbToCheckInThisPage = Math.min(NB_CHARGES_PER_QUERY, NB_CHARGES_TO_CHECK - totalAlreadyChecked);
    console.info(`🔎️ Checking transactions ${totalAlreadyChecked} to ${totalAlreadyChecked + nbToCheckInThisPage}`);

    // Retrieve the list and check all charges
    const charges = await listCharges({ limit: nbToCheckInThisPage, starting_after: lastChargeId });
    for (let idx = 0; idx < charges.data.length; idx++) {
      await checkCharge(charges.data[idx]);
      totalAlreadyChecked += 1;
      if (idx >= nbToCheckInThisPage) {
        break;
      }
    }

    // If list length is less than NB_CHARGES_PER_QUERY, we reached the end
    if (charges.data.length < NB_CHARGES_PER_QUERY) {
      break;
    }

    // Register last charge for pagination
    lastChargeId = get(last(charges.data), 'id');
  }

  console.info('--------------------------------------\nDone!');
}

main().then(() => process.exit());
