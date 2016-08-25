/**
 * Dependencies.
 */
import Promise from 'bluebird';
import models, {sequelize} from '../server/models';

import data from './mocks/data.json';
import userlib from '../server/lib/userlib';

/**
 * Private methods.
 */
const getData = (item) => Object.assign({}, data[item]); // to avoid changing these data

const clearbitStubBeforeEach = sandbox => {
  sandbox.stub(userlib.clearbit.Enrichment, 'find', () => {
    return Promise.reject(new userlib.clearbit.Enrichment.NotFoundError());
  });
};

const clearbitStubAfterEach = (sandbox) => sandbox.restore();

/**
 * Utils.
 */
// TODO get rid of wrapper arrow func
export default () => {

  return {

    cleanAllDb: () => sequelize.sync({force: true})
      .then(() => models.Application.create(getData('applicationSuper')))
      .catch(e => {
        console.error("test/utils.js> Sequelize Error: Couldn't recreate the schema", e);
        process.exit(1);
      }),

    /**
     * Test data.
     */
    data: getData,
    clearbitStubBeforeEach,
    clearbitStubAfterEach
  }
};
