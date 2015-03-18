/**
 * Dependencies.
 */
var async = require('async')
  , data  = require('./mocks/data.json')
  ;

/**
 * Utils.
 */
module.exports = function() {

  return {

    cleanAllDb: function(callback) {

    },

    /**
     * Test data.
     */
    data: function(item) {
      return _.omit(data[item]); // to avoid changing these data
    }

  }

}
