const _ = require('lodash');
import models from '../server/models';

const testStripeAccounts = {
  'opensource': {
    service: 'stripe',
    username: 'acct_18KWlTLzdXg9xKNS',
    token: 'sk_test_iDWQubtz4ixk0FQg1csgCi6p',
    data: {
      publishableKey: 'pk_test_l7H1cDlh2AekeETfq742VJbC'
    },
    CollectiveId: 83
  },
  'brussesltogether': {
    service: 'stripe',
    username: 'acct_198T7jD8MNtzsDcg',
    token: 'sk_test_Hcsz2JJdMzEsU28c6I8TyYYK',
    data: {
      publishableKey: 'pk_test_OSQ8IaRSyLe9FVHMivgRjQng'
    },
    CollectiveId: 207
  },
  'wwcode': {
    service: 'stripe',
    username: 'acct_xxxxxxxxxxxxxxxx',
    token: 'sk_test_Hcsz2JJdMzEsU2xxxxxxxxxx',
    data: {
      publishableKey: 'pk_test_OSQ8IaRSyLe9FVxxxxxxxxxx'
    },
    CollectiveId: 51
  }
}

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

models.ConnectedAccount.destroy({ where: { service: 'stripe' }, force: true})
.then(() => models.ConnectedAccount.create(testStripeAccounts.opensource)) // will fail if the open source collective is not present (e.g. when migrating wwcode_test)
.then(() => models.ConnectedAccount.create(testStripeAccounts.brussesltogether))
.then(() => models.ConnectedAccount.create(testStripeAccounts.wwcode))
.then(() => done())
.catch(done)
