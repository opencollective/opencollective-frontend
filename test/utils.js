/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var data  = require('./mocks/data.json');

/**
 * Private methods.
 */
var getData = function(item) {
  return _.extend({}, data[item]); // to avoid changing these data
};

var createSuperApplication = function(callback) {
  app.set('models').Application.create(getData('applicationSuper')).done(callback);
};

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
    data: getData

  }

}
