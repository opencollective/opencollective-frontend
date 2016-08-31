const app = require('../server/index');
import models from '../server/models';
const stripeGateway = require('../server/gateways').stripe;
const constants = require('../server/constants/transactions');

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

var message = [];

// replace with real values
const OLD_STRIPE_ACCOUNT_ID = 5; // from StripeAccounts table
const NEW_STRIPE_ACCOUNT_ID = 23; // from StripeAccounts table

var oldStripeAccount = null;
var newStripeAccount = null;
var currentOCSubscription;

return models.StripeAccount.findById(OLD_STRIPE_ACCOUNT_ID)
.tap(stripeAccount => oldStripeAccount = stripeAccount) // store old stripe account
.then(() => models.StripeAccount.findById(NEW_STRIPE_ACCOUNT_ID))
.tap(stripeAccount => newStripeAccount = stripeAccount) // store new stripe account

// fetch all active subscriptions for this account
.then(() => stripeGateway.getSubscriptionsList(oldStripeAccount, 10)) // get one at a time for now
.then(oldStripeSubscriptionList => {
  console.log("Subscriptions fetched: ", oldStripeSubscriptionList.data.length);
  return oldStripeSubscriptionList.data;
})
.each(oldStripeSubscription => {
  console.log("---OLD SUBSCRIPTION----");
  console.log(oldStripeSubscription);
  console.log("---END OLD SUBSCRIPTION---\n");

  // create or get a plan
  const plan = {
    interval: oldStripeSubscription.plan.interval,
    amount: oldStripeSubscription.plan.amount,
    currency: oldStripeSubscription.plan.currency
  }

  // make sure that this subscription id is in our database
  return models.Subscription.find({where: {stripeSubscriptionId: oldStripeSubscription.id}})
    .then(ocSubscription => {
      if (ocSubscription && ocSubscription.isActive) {
        console.log("Subscription found in our DB: ", ocSubscription.id);
        currentOCSubscription = ocSubscription;
      } else {
        throw new Error("Subscription not found in our DB: ", oldStripeSubscription);
      }
    })

    // make sure this customer is on the new stripe account
    .then(() => stripeGateway.retrieveCustomer(newStripeAccount, oldStripeSubscription.customer))
    .then(customer => {
      if (customer) {
        console.log("Customer found: ", customer.id);
      } else {
        throw new Error("Customer not found in new account");
      }
    })

    // start setting up the new subscription
    .then(() => stripeGateway.getOrCreatePlan(newStripeAccount, plan))

    // add a new subscription
    .then(plan => {
      const subscription = {
        // carryover fields
        plan: plan.id,
        application_fee_percent: constants.OC_FEE_PERCENT,
        metadata: oldStripeSubscription.metadata,
        // needed to make sure we don't double charge them
        billing_cycle_anchor: oldStripeSubscription.current_period_end,
        prorate: false
      };
      return stripeGateway.createSubscription(
        newStripeAccount,
        oldStripeSubscription.customer,
        subscription);
    })
    .tap(console.log)

    // store the new stripeSubscription info in our table
    .then(newStripeSubscription => {
      const oldData = currentOCSubscription.data;

      return currentOCSubscription.updateAttributes({
        data: Object.assign({}, newStripeSubscription, { oldData }),
        stripeSubscriptionId: newStripeSubscription.id
      });
    })
    // delete the old subscription from stripe
    .then(() => stripeGateway.cancelSubscription(oldStripeAccount, oldStripeSubscription.id))
    .catch(err => {
      console.log("ERROR: ", err, oldStripeSubscription)
      return;
    });
})
.then(() => done())
.catch(done)



/* QUERY to get all subscriptions from one host

models.sequelize.query(`
    SELECT
    d.id as donationid,
    d."UserId",
    d."GroupId",
    d.currency,
    d.title,
    d."SubscriptionId",
    d."createdAt",
    s.interval,
    s.data,
    s."stripeSubscriptionId",
    s."activatedAt",
    t.id as "TransactionId",
    pm."customerId"
  FROM "Donations" d

  LEFT JOIN "Subscriptions" s on d."SubscriptionId" = s.id
  LEFT JOIN "UserGroups" ug on d."GroupId" = ug."GroupId"
  LEFT JOIN "Transactions" t on (d.id = t."DonationId"
                  AND t.id = (SELECT MAX(id) FROM "Transactions" t WHERE t."SubscriptionId" = s.id))
  LEFT join "PaymentMethods" pm on t."PaymentMethodId" = pm.id

  WHERE d."SubscriptionId" IS NOT NULL
    AND d."deletedAt" IS NULL
    AND s."deletedAt" IS NULL
    AND t."deletedAt" IS NULL
    AND s."isActive" = true
    AND ug.role LIKE 'HOST'
    AND ug."UserId" = 40

  order by d."GroupId""
`)
*/
