/**
 * Dependencies.
 */
var async = require('async')
  , _ = require('underscore')
  , data  = require('./mocks/data.json')
  ;

/**
 * Utils.
 */
module.exports = function(app) {

  return {

    cleanAllDb: function(callback) {
      app.set('models').sequelize.sync({force: true}).done(callback);
    },

    /**
     * Test data.
     */
    data: function(item) {
      return _.omit(data[item]); // to avoid changing these data
    }

  }

}
