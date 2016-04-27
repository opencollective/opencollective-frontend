/**
 * Dependencies.
 */
const _ = require('lodash');
const Bluebird = require('bluebird');
const app = require('../index');
const models = app.set('models');

const data  = require('./mocks/data.json');
const userlib = require('../server/lib/userlib');

/**
 * Private methods.
 */
const getData = (item) => {
  return _.extend({}, data[item]); // to avoid changing these data
};

const createSuperApplication = (callback) => {
  models.Application.create(getData('applicationSuper')).done(callback);
};

const clearbitStubBeforeEach = (sandbox) => {
  sandbox.stub(userlib.clearbit.Enrichment, 'find', () => {
      return new Bluebird((resolve, reject) => {
        reject(userlib.clearbit.Enrichment.NotFoundError(' NotFound'));
      });
    });
};

const clearbitStubAfterEach = (sandbox) => {
  sandbox.restore();
}

/**
 * Utils.
 */
module.exports = () => {

  return {

    cleanAllDb: (callback) => {
      app.set('models').sequelize.sync({force: true}).done((e) => {
        if (e) {
          console.error("test/utils.js> Sequelize Error: Couldn't recreate the schema", e);
          process.exit(1);
        }
        createSuperApplication(callback);
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
    clearbitStubBeforeEach: clearbitStubBeforeEach,
    clearbitStubAfterEach: clearbitStubAfterEach
  }
}
