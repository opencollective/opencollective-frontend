/**
 * Dependencies.
 */
var async = require('async')
  , _ = require('underscore')
  , app       = require('../index')
  , data  = require('./mocks/data.json')
  ;

/**
 * Utils.
 */
module.exports = function() {

  return {

    cleanAllDb: function(callback) {
      app.set('models').sequelize.sync({force: true}).done(callback);
    },

    /**
     * Test data.
     */
    data: function(item) {
      return _.extend({}, data[item]); // to avoid changing these data
    }

  }

}
