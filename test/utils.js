import config from 'config';
import debug from 'debug';
import nock from 'nock';

import Promise from 'bluebird';
import Stripe from 'stripe';
import { graphql } from 'graphql';
import { isArray, values } from 'lodash';

/* Test data */
import jsonData from './mocks/data';

/* Server code being used */
import userlib from '../server/lib/userlib';
import schema from '../server/graphql/schema';
import { loaders } from '../server/graphql/loaders';
import { sequelize } from '../server/models';
import * as libcache from '../server/lib/cache';
import * as libpayments from '../server/lib/payments';
import * as stripeGateway from '../server/paymentProviders/stripe/gateway';
import * as db_restore from '../scripts/db_restore';

const appStripe = Stripe(config.stripe.secret);

if (process.env.RECORD) {
  nock.recorder.rec();
}

jsonData.application = {
  name: 'client',
  api_key: config.keys.opencollective.api_key,
};

export const data = item => {
  const copy = Object.assign({}, jsonData[item]); // to avoid changing these data
  return isArray(jsonData[item]) ? values(copy) : copy;
};

export const clearbitStubBeforeEach = sandbox => {
  sandbox.stub(userlib.clearbit.Enrichment, 'find').callsFake(() => {
    return Promise.reject(new userlib.clearbit.Enrichment.NotFoundError());
  });
};

export const clearbitStubAfterEach = sandbox => sandbox.restore();

export const resetCaches = () => libcache.clearCache();

export const resetTestDB = () =>
  sequelize.sync({ force: true }).catch(e => {
    console.error(
      "test/utils.js> Sequelize Error: Couldn't recreate the schema",
      e,
    );
    process.exit(1);
  });

export async function loadDB(dbname) {
  await db_restore.main({ force: true, file: dbname });
}

export const stringify = json => {
  return JSON.stringify(json, null, '>>>>')
    .replace(/\n>>>>+"([^"]+)"/g, '$1')
    .replace(/\n|>>>>+/g, '');
};

export const makeRequest = (remoteUser, query) => {
  return {
    remoteUser,
    body: { query },
    loaders: loaders({ remoteUser }),
  };
};

export const inspectSpy = (spy, argsCount) => {
  for (let i = 0; i < spy.callCount; i++) {
    console.log(`>>> spy.args[${i}]`, { ...spy.args[i].slice(0, argsCount) });
  }
};

/**
 * Wait for condition to be met
 * E.g. await waitForCondition(() => emailSendMessageSpy.callCount === 1)
 * @param {*} cond
 * @param {*} options: { timeout, delay }
 */
export const waitForCondition = (
  cond,
  options = { timeout: 10000, delay: 0 },
) =>
  new Promise(resolve => {
    let hasConditionBeenMet = false;
    setTimeout(() => {
      if (hasConditionBeenMet) return;
      console.log('>>> waitForCondition Timeout Error');
      console.trace();
      throw new Error('Timeout waiting for condition', cond);
    }, options.timeout || 10000);
    const isConditionMet = () => {
      hasConditionBeenMet = Boolean(cond());
      if (options.tag) {
        console.log(
          new Date().getTime(),
          '>>> ',
          options.tag,
          'is condition met?',
          hasConditionBeenMet,
        );
      }
      if (hasConditionBeenMet) {
        return setTimeout(resolve, options.delay || 0);
      } else {
        return setTimeout(isConditionMet, options.step || 100);
      }
    };
    isConditionMet();
  });

export const graphqlQuery = async (query, variables, remoteUser) => {
  const prepare = () => {
    if (remoteUser) {
      remoteUser.rolesByCollectiveId = null; // force refetching the roles
      return remoteUser.populateRoles();
    } else {
      return Promise.resolve();
    }
  };

  if (process.env.DEBUG && process.env.DEBUG.match(/graphql/)) {
    debug('graphql')('query', query);
    debug('graphql')('variables', variables);
    debug('graphql')('context', remoteUser);
  }

  return prepare().then(() =>
    graphql(
      schema,
      query,
      null, // rootValue
      makeRequest(remoteUser, query), // context
      variables,
    ),
  );
};

/** Helper for interpreting fee description in BDD tests
 *
 * The fee can be expressed as an absolute value, like "50" which
 * means $50.00 (the value will be multiplied by 100 to account for
 * the cents).
 *
 * The fee can also be expressed as a percentage of the value. In that
 * case it looks like "5%". That's why this helper takes the amount
 * parameter so the absolute value of the fee can be calculated.
 *
 * @param {Number} amount is the total amount of the expense. Used to
 *  calculate the absolute value of fees expressed as percentages.
 * @param {String} feeStr is the data read from the `.features` test
 *  file. That can be expressed as an absolute value or as a
 *  percentage.
 */
export const readFee = (amount, feeStr) => {
  if (!feeStr) {
    return 0;
  } else if (feeStr.endsWith('%')) {
    const asFloat = parseFloat(feeStr.replace('%', ''));
    return asFloat > 0 ? libpayments.calcFee(amount, asFloat) : asFloat;
  } else {
    /* The `* 100` is for converting from cents */
    return parseFloat(feeStr) * 100;
  }
};

/* ---- Stripe Helpers ---- */

export const createStripeToken = async () => {
  return appStripe.tokens
    .create({
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2028,
        cvc: 222,
      },
    })
    .then(st => st.id);
};

/** Stub Stripe methods used while creating transactions
 *
 * @param {sinon.sandbox} sandbox is the sandbox that the test created
 *  and the one that *must* be reset after the test is done.
 */
export function stubStripeCreate(sandbox, overloadDefaults) {
  const values = {
    customer: { id: 'cus_BM7mGwp1Ea8RtL' },
    token: { id: 'tok_1AzPXGD8MNtzsDcgwaltZuvp' },
    charge: { id: 'ch_1AzPXHD8MNtzsDcgXpUhv4pm' },
    ...overloadDefaults,
  };
  /* Little helper function that returns the stub with a given
   * value. */
  const factory = name => async () => values[name];
  sandbox.stub(stripeGateway, 'createCustomer').callsFake(factory('customer'));
  sandbox.stub(stripeGateway, 'createToken').callsFake(factory('token'));
  sandbox.stub(stripeGateway, 'createCharge').callsFake(factory('charge'));
}

export function stubStripeBalance(
  sandbox,
  amount,
  currency,
  applicationFee = 0,
  stripeFee = 0,
) {
  const fee_details = [];
  const fee = applicationFee + stripeFee;
  if (applicationFee && applicationFee > 0)
    fee_details.push({ type: 'application_fee', amount: applicationFee });
  if (stripeFee && stripeFee > 0)
    fee_details.push({ type: 'stripe_fee', amount: stripeFee });
  return sandbox
    .stub(stripeGateway, 'retrieveBalanceTransaction')
    .callsFake(async () => ({
      id: 'txn_1Bs9EEBYycQg1OMfTR33Y5Xr',
      object: 'balance_transaction',
      amount,
      currency: currency.toLowerCase(),
      fee,
      fee_details,
      net: amount - fee,
      status: 'pending',
      type: 'charge',
    }));
}
