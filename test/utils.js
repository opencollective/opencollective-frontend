/**
 * Dependencies.
 */
const Promise = require('bluebird');
const app = require('../index');
const models = app.set('models');

const data  = require('./mocks/data.json');
const userlib = require('../server/lib/userlib');

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
module.exports = () => {

  return {

    cleanAllDb: () => app.get('models').sequelize.sync({force: true})
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
