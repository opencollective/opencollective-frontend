/**
 * Dependencies.
 */
const _ = require('lodash');
const Bluebird = require('bluebird');
const app = require('../index');
const data  = require('./mocks/data.json');
const userlib = require('../app/lib/userlib');

/**
 * Private methods.
 */
const getData = (item) => {
  return _.extend({}, data[item]); // to avoid changing these data
};

const createSuperApplication = (callback) => {
  app.set('models').Application.create(getData('applicationSuper')).done(callback);
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
        if (e) return callback(e);
        createSuperApplication(callback);
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
