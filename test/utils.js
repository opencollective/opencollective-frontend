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
const getData = function(item) {
  return _.extend({}, data[item]); // to avoid changing these data
};

const createSuperApplication = function(callback) {
  app.set('models').Application.create(getData('applicationSuper')).done(callback);
};

const clearbitStubBeforeEach = function(sandbox) {
  sandbox.stub(userlib.clearbit.Enrichment, 'find', () => {
      return new Bluebird((resolve, reject) => {
        reject(userlib.clearbit.Enrichment.NotFoundError(' NotFound'));
      });
    });
};

const clearbitStubAfterEach = function(sandbox) {
  sandbox.restore();
}

/**
 * Utils.
 */
module.exports = function() {

  return {

    cleanAllDb: function(callback) {
      app.set('models').sequelize.sync({force: true}).done(function(e) {
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
