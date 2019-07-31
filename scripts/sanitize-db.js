#!/usr/bin/env node
import '../server/env';

import models, { Op } from '../server/models';
import channels from '../server/constants/channels';

const testStripeAccounts = {
  // Open Source Collective 501c6
  opensource: {
    service: 'stripe',
    username: 'acct_18KWlTLzdXg9xKNS',
    token: 'sk_test_iDWQubtz4ixk0FQg1csgCi6p',
    data: {
      publishableKey: 'pk_test_l7H1cDlh2AekeETfq742VJbC',
    },
    CollectiveId: 11004,
  },
  opensource_dvl: {
    // legacy for opencollective_dvl.pgsql
    service: 'stripe',
    username: 'acct_18KWlTLzdXg9xKNS',
    token: 'sk_test_iDWQubtz4ixk0FQg1csgCi6p',
    data: {
      publishableKey: 'pk_test_l7H1cDlh2AekeETfq742VJbC',
    },
    CollectiveId: 9805,
  },
  // Open Collective Inc. host for meetups
  other: {
    service: 'stripe',
    username: 'acct_18KWlTLzdXg9xKNS',
    token: 'sk_test_iDWQubtz4ixk0FQg1csgCi6p',
    data: {
      publishableKey: 'pk_test_l7H1cDlh2AekeETfq742VJbC',
    },
    CollectiveId: 8674,
  },
  brussesltogether: {
    service: 'stripe',
    username: 'acct_198T7jD8MNtzsDcg',
    token: 'sk_test_Hcsz2JJdMzEsU28c6I8TyYYK',
    data: {
      publishableKey: 'pk_test_OSQ8IaRSyLe9FVHMivgRjQng',
    },
    CollectiveId: 9802,
  },
};

const createConnectedAccount = hostname => {
  return models.ConnectedAccount.create(testStripeAccounts[hostname]).catch(e => {
    // will fail if the host is not present
    console.log(`[warning] Unable to create a connected account for ${hostname}`);
    if (process.env.DEBUG) {
      console.error(e);
    }
  });
};

const replaceHostStripeTokens = () => {
  return models.ConnectedAccount.destroy({ where: { service: 'stripe' }, force: true })
    .then(() => createConnectedAccount('opensource'))
    .then(() => createConnectedAccount('opensource_dvl'))
    .then(() => createConnectedAccount('other'))
    .then(() => createConnectedAccount('brussesltogether'))
    .catch(e => console.error('There was an error replacing the hosts stripe tokens. Please do it manually', e));
};

const replaceUsersStripeTokens = () => {
  return models.PaymentMethod.update({ token: 'tok_mastercard' }, { where: { service: 'stripe' }, force: true }).catch(
    e => console.error("Can't remove users stripe tokens. Please do it manually", e),
  );
};

// Removes all tokens from connected accounts
const removeConnectedAccountsTokens = () => {
  return models.ConnectedAccount.update(
    { token: null },
    { where: { service: { [Op.ne]: 'stripe' } }, force: true },
  ).catch(e => {
    console.error("Can't remove tokens from connected accounts. Please do it manually", e);
  });
};

// Remove all webhooks to ensure we won't use users Zapier apps
const deleteWebhooks = () => {
  return models.Notification.destroy({ where: { channel: channels.WEBHOOK } }).catch(e =>
    console.error('There was an error removing the webhooks. Please do it manually', e),
  );
};

const deleteLegalDocuments = () => {
  return models.LegalDocument.destroy({ truncate: true, force: true })
    .then(() => models.RequiredLegalDocument.destroy({ truncate: true, force: true }))
    .catch(e => console.error('Cannot remove legal documents, please do it manually', e));
};

Promise.all([
  replaceHostStripeTokens(),
  replaceUsersStripeTokens(),
  removeConnectedAccountsTokens(),
  deleteWebhooks(),
  deleteLegalDocuments(),
]).then(() => {
  console.log('Done!');
  process.exit();
});
