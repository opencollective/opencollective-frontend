import config from 'config';
import debug from 'debug';
import nock from 'nock';
import { expect } from 'chai';

import Promise from 'bluebird';
import { graphql } from 'graphql';
import { isArray, values, get, cloneDeep } from 'lodash';
import { execSync } from 'child_process';

/* Test data */
import jsonData from './mocks/data';

/* Server code being used */
import stripe from '../server/lib/stripe';
import schemaV1 from '../server/graphql/v1/schema';
import schemaV2 from '../server/graphql/v2/schema';
import { loaders } from '../server/graphql/loaders';
import { sequelize } from '../server/models';
import cache from '../server/lib/cache';
import * as libpayments from '../server/lib/payments';
import * as db_restore from '../scripts/db_restore';

if (process.env.RECORD) {
  nock.recorder.rec();
}

jsonData.application = {
  name: 'client',
  api_key: config.keys.opencollective.apiKey,
};

const debugWaitForCondition = debug('waitForCondition');

export const data = path => {
  const copy = cloneDeep(get(jsonData, path)); // to avoid changing these data
  return isArray(get(jsonData, path)) ? values(copy) : copy;
};

export const resetCaches = () => cache.clear();

export const resetTestDB = async () => {
  await sequelize.sync({ force: true }).catch(e => {
    console.error("test/utils.js> Sequelize Error: Couldn't recreate the schema", e);
    process.exit(1);
  });
  // That could be an alternative but this doesn't work
  // await sequelize.truncate({ force: true, cascade: true });
};

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
export const waitForCondition = (cond, options = { timeout: 10000, delay: 0 }) =>
  new Promise(resolve => {
    let hasConditionBeenMet = false;
    setTimeout(() => {
      if (hasConditionBeenMet) {
        return;
      }
      console.log('>>> waitForCondition Timeout Error');
      console.trace();
      throw new Error('Timeout waiting for condition', cond);
    }, options.timeout || 10000);
    const isConditionMet = () => {
      hasConditionBeenMet = Boolean(cond());
      debugWaitForCondition(options.tag, `Has condition been met?`, hasConditionBeenMet);
      if (hasConditionBeenMet) {
        return setTimeout(resolve, options.delay || 0);
      } else {
        return setTimeout(isConditionMet, options.step || 100);
      }
    };
    isConditionMet();
  });

/**
 * This function allows to test queries and mutations against a specific schema.
 * @param {string} query - Queries and Mutations to serve against the type schema. Example: `query Expense($id: Int!) { Expense(id: $id) { description } }`
 * @param {object} variables - Variables to use in the queries and mutations. Example: { id: 1 }
 * @param {object} remoteUser - The user to add to the context. It is not required.
 * @param {object} schema - Schema to which queries and mutations will be served against. Schema v1 by default.
 */
export const graphqlQuery = async (query, variables, remoteUser, schema = schemaV1) => {
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

/**
 * This function allows to test queries and mutations against schema v2.
 * @param {string} query - Queries and Mutations to serve against the type schema. Example: `query Expense($id: Int!) { Expense(id: $id) { description } }`
 * @param {object} variables - Variables to use in the queries and mutations. Example: { id: 1 }
 * @param {object} remoteUser - The user to add to the context. It is not required.
 */
export async function graphqlQueryV2(query, variables, remoteUser) {
  return graphqlQuery(query, variables, remoteUser, schemaV2);
}

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

export const getTerminalCols = () => {
  let length = 40;
  if (process.platform === 'win32') {
    return length;
  }
  try {
    length = parseInt(execSync('tput cols').toString());
  } catch {
    return length;
  }
};

export const separator = length => {
  const terminalCols = length || getTerminalCols();

  let separator = '';
  for (let i = 0; i < terminalCols; i++) {
    separator += '-';
  }
  console.log(`\n${separator}\n`);
};

/* ---- Stripe Helpers ---- */

export const createStripeToken = async () => {
  return stripe.tokens
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
    paymentIntent: { charges: { data: [{ id: 'ch_1AzPXHD8MNtzsDcgXpUhv4pm' }] }, status: 'succeeded' },
    ...overloadDefaults,
  };
  /* Little helper function that returns the stub with a given
   * value. */
  const factory = name => async () => values[name];
  sandbox.stub(stripe.tokens, 'create').callsFake(factory('token'));

  sandbox.stub(stripe.customers, 'create').callsFake(async ({ source }) => {
    if (source.startsWith('tok_chargeDeclined')) {
      throw new Error('Your card was declined.');
    }

    return values.customer;
  });

  sandbox.stub(stripe.customers, 'retrieve').callsFake(factory('customer'));
  sandbox.stub(stripe.paymentIntents, 'create').callsFake(factory('paymentIntent'));
}

export function stubStripeBalance(sandbox, amount, currency, applicationFee = 0, stripeFee = 0) {
  const fee_details = [];
  const fee = applicationFee + stripeFee;
  if (applicationFee && applicationFee > 0) {
    fee_details.push({ type: 'application_fee', amount: applicationFee });
  }
  if (stripeFee && stripeFee > 0) {
    fee_details.push({ type: 'stripe_fee', amount: stripeFee });
  }

  const balanceTransaction = {
    id: 'txn_1Bs9EEBYycQg1OMfTR33Y5Xr',
    object: 'balance_transaction',
    amount,
    currency: currency.toLowerCase(),
    fee,
    fee_details,
    net: amount - fee,
    status: 'pending',
    type: 'charge',
  };
  sandbox.stub(stripe.balanceTransactions, 'retrieve').callsFake(() => Promise.resolve(balanceTransaction));
}

export function expectNoErrorsFromResult(res) {
  res.errors && console.error(res.errors);
  expect(res.errors).to.not.exist;
}

/**
 * traverse callback function definition.
 * This callback will be called for every property of object.
 * https://jsdoc.app/tags-param.html#callback-functions
 *
 * @callback PropertyCallback
 * @param {string} key - Object key.
 * @param {*} value - Object value at the given key.
 */

/**
 * Traverse an object and call cb for every property.
 * @param {object} obj - Object to traverse.
 * @param {PropertyCallback} cb - Callback function to be called for every property of obj.
 */
export function traverse(obj, cb) {
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      traverse(obj[key], cb);
    } else {
      cb(key, obj[key]);
    }
  }
}
