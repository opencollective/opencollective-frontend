const Stripe = require('stripe');
const app = require('../index');
const models = app.set('models');

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

models.StripeAccount.findAll({})
.map((stripeAccount) => {
  const stripe = Stripe(stripeAccount.accessToken);

  return stripe.invoices.list({})
  .then(invoices => invoices.data.map(invoice => invoice.subscription))
  .map(stripeSubscriptionId => {
    return models.Transaction.findAll({
      include: [
        { model: models.Subscription, where: { stripeSubscriptionId } }
      ]
    })
    .then(transactions => {
      if (transactions.length === 0) {
        console.log(`missing transaction with Stripe subscription id ${stripeSubscriptionId} and account ${stripeAccount.stripeUserId}`);
      }

      return;
    });
  });

})
.then(() => done())
.catch(done)