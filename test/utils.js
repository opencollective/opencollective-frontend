import Promise from 'bluebird';
import {sequelize} from '../server/models';
import jsonData from './mocks/data';
import userlib from '../server/lib/userlib';
import config from 'config';
import { isArray, values } from 'lodash';
import path from 'path';
import { exec } from 'child_process';
import debug from 'debug';
import { loaders } from '../server/graphql/loaders';
import { graphql } from 'graphql';
import schema from '../server/graphql/schema';
import Stripe from 'stripe';
const appStripe = Stripe(config.stripe.secret);
import nock from 'nock';
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