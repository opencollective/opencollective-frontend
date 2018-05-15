import config from 'config';
import debug from 'debug';
import nock from 'nock';
import path from 'path';
import Promise from 'bluebird';
import Stripe from 'stripe';
import { exec } from 'child_process';
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
import * as stripeGateway from '../server/paymentProviders/stripe/gateway';

const appStripe = Stripe(config.stripe.secret);

if (process.env.RECORD) {
  nock.recorder.rec();
}

jsonData.application = { name: 'client', api_key: config.keys.opencollective.api_key };

export const data = (item) => {
  const copy = Object.assign({}, jsonData[item]); // to avoid changing these data
  return (isArray(jsonData[item])) ? values(copy) : copy;
}

export const clearbitStubBeforeEach = sandbox => {
  sandbox.stub(userlib.clearbit.Enrichment, 'find', () => {
    return Promise.reject(new userlib.clearbit.Enrichment.NotFoundError());
  });
};

export const clearbitStubAfterEach = (sandbox) => sandbox.restore();

export const resetCaches = () => libcache.clearCache();

export const resetTestDB = () => sequelize.sync({force: true})
  .catch(e => {
    console.error("test/utils.js> Sequelize Error: Couldn't recreate the schema", e);
    process.exit(1);
  });

export function loadDB(dbname) {

  const importDB = (cb) => {
    const cmd = `${path.join(__dirname, '../scripts/db_restore.sh')} -d ${config.database.database} -U ${config.database.username} -f ${path.join(__dirname,"dbdumps", `${dbname}.pgsql`)}`;
    exec(cmd, cb);
  };

  return new Promise((resolve, reject) => {
    importDB((err, stdout) => {
      if (!err) {
        debug("utils")(`${dbname} imported successfully`, stdout);
        return resolve(stdout);
      }
      if (err) { // First try may fail due to foreign keys restrictions
        debug("utils")(`error importing ${dbname}`, err);
        importDB((err, stdout) => {
          if (err) {
            debug("utils")(`2nd attempt: error importing ${dbname}`, err);
            return reject(err);
          } else {
            return resolve(stdout);
          }
        });
      }
    })
  });
}

export const stringify = (json) => {
  return JSON.stringify(json, null, '>>>>').replace(/\n>>>>+"([^"]+)"/g,'$1').replace(/\n|>>>>+/g,'')
}

export const makeRequest = (remoteUser, query) => {
  return {
    remoteUser,
    body: { query },
    loaders: loaders({ remoteUser })
  }
}

export const inspectSpy = (spy, argsCount) => {
  for (let i=0; i <  spy.callCount; i++) {
    console.log(`>>> spy.args[${i}]`,  { ...spy.args[i].slice(0, argsCount)});
  }
}

/**
 * Wait for condition to be met
 * E.g. await waitForCondition(() => emailSendMessageSpy.callCount === 1)
 * @param {*} cond
 * @param {*} options: { timeout, delay }
 */
export const waitForCondition = (cond, options = { timeout: 10000, delay: 0 }) => new Promise(resolve => {
  let hasConditionBeenMet = false;
  setTimeout(() => {
    if (hasConditionBeenMet) return;
    console.log(">>> waitForCondition Timeout Error");
    console.trace();
    throw new Error("Timeout waiting for condition", cond);
  }, options.timeout || 10000);
  const isConditionMet = () => {
    hasConditionBeenMet = Boolean(cond());
    if (options.tag) {
      console.log(new Date().getTime(), ">>> ", options.tag, "is condition met?", hasConditionBeenMet);
    }
    if (hasConditionBeenMet) {
      return setTimeout(resolve, options.delay || 0);
    } else {
      return setTimeout(isConditionMet, options.step || 100);
    }
  }
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
  }

  if (process.env.DEBUG && process.env.DEBUG.match(/graphql/)) {
    debug('graphql')("query", query);
    debug('graphql')("variables", variables);
    debug('graphql')("context", remoteUser);
  }

  return prepare()
    .then(() => graphql(
      schema,
      query,
      null, // rootValue
      makeRequest(remoteUser, query), // context
      variables
    ));
}

/* ---- Stripe Helpers ---- */

export const createStripeToken = async () => {
    return appStripe.tokens.create({
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2028,
        cvc: 222
      }
    })
    .then(st => st.id);
}

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
  const factory = (name) => async () => values[name];
  sandbox.stub(stripeGateway, "createCustomer", factory('customer'));
  sandbox.stub(stripeGateway, "createToken", factory('token'));
  sandbox.stub(stripeGateway, "createCharge", factory('charge'));
}

export function stubStripeBalance(sandbox, amount, currency, applicationFee=0, stripeFee=0) {
  const fee_details = [];
  const fee = applicationFee + stripeFee;
  if (applicationFee > 0)
    fee_details.push({ type: 'application_fee', amount: applicationFee });
  if (stripeFee > 0)
    fee_details.push({ type: 'stripe_fee', amount: stripeFee });
  return sandbox.stub(stripeGateway, "retrieveBalanceTransaction", async () => ({
    id: "txn_1Bs9EEBYycQg1OMfTR33Y5Xr",
    object: "balance_transaction",
    amount,
    currency: currency.toLowerCase(),
    fee,
    fee_details,
    net: amount - fee,
    status: "pending",
    type: "charge",
  }));
}
