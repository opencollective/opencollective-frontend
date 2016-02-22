const app = require('../index');
const models = app.set('models');

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

models.StripeAccount.findAll({})
.map((stripeAccount) => {

  stripeAccount.accessToken = 'sk_test_3jGhCKe3e1KiN8gHrdDqqHg4';
  stripeAccount.stripePublishableKey = 'pk_test_5olkhgG5FgJDHcGpJllmCj6z';

  return stripeAccount.save();
})
.then(() => done())
.catch(done)