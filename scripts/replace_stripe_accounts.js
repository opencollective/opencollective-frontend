const _ = require('lodash');
import models from '../server/models';

const testStripeAccounts = {
  // Open Source Collective 501c6
  'opensource': {
    service: 'stripe',
    username: 'acct_18KWlTLzdXg9xKNS',
    token: 'sk_test_iDWQubtz4ixk0FQg1csgCi6p',
    data: {
      publishableKey: 'pk_test_l7H1cDlh2AekeETfq742VJbC'
    },
    CollectiveId: 11004
  },
  // Open Collective Inc. host for meetups
  'other': {
    service: 'stripe',
    username: 'acct_18KWlTLzdXg9xKNS',
    token: 'sk_test_iDWQubtz4ixk0FQg1csgCi6p',
    data: {
      publishableKey: 'pk_test_l7H1cDlh2AekeETfq742VJbC'
    },
    CollectiveId: 8674
  },
  'brussesltogether': {
    service: 'stripe',
    username: 'acct_198T7jD8MNtzsDcg',
    token: 'sk_test_Hcsz2JJdMzEsU28c6I8TyYYK',
    data: {
      publishableKey: 'pk_test_OSQ8IaRSyLe9FVHMivgRjQng'
    },
    CollectiveId: 9802
  }
}

testStripeAccounts.wwcode = {
  ...testStripeAccounts.opensource,
  CollectiveId: 9804
};

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

const createConnectedAccount = (hostname) => {
  return models.ConnectedAccount
    .create(testStripeAccounts[hostname])
    .catch(e => {
      // will fail if the host is not present (e.g. when migrating wwcode_test)
      console.log(`[warning] Unable to create a connected account for ${hostname}`);
      if (process.env.DEBUG) {
        console.error(e);
      }
    });
}

models.ConnectedAccount.destroy({ where: { service: 'stripe' }, force: true})
.then(() => createConnectedAccount('opensource'))
.then(() => createConnectedAccount('other'))
.then(() => createConnectedAccount('brussesltogether'))
.then(() => createConnectedAccount('wwcode'))
.then(() => done())
.catch(done)
