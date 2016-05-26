/**
 * Dependencies.
 */
const _ = require('lodash');
const Promise = require('bluebird');
const app = require('../index');
const models = app.set('models');

const data  = require('./mocks/data.json');
const userlib = require('../server/lib/userlib');

/**
 * Private methods.
 */
const getData = (item) => _.extend({}, data[item]); // to avoid changing these data

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

    cleanAllDb: (callback) => {
      app.get('models').sequelize.sync({force: true})
        .then(() => models.Application.create(getData('applicationSuper')))
        .tap(a => callback(null, a))
        .catch(e => {
          console.error("test/utils.js> Sequelize Error: Couldn't recreate the schema", e);
          process.exit(1);
        });
    },

    createUsers: (users, cb) => {
      const promises = users.map(u => models.User.create(getData(u)));
      Promise.all(promises).then(cb)
      .catch(e => {
        console.error("Sequelize Error: ", e.errors);
      });
    },

    /**
     * Test data.
     */
    data: getData,
    clearbitStubBeforeEach,
    clearbitStubAfterEach
  }
};
