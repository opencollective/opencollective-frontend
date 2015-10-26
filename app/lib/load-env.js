var _ = require('lodash');

module.exports = function() {

  /**
   * Load .env file
   */

  if (_.contains(['test', 'development'], process.env.NODE_ENV)) {
    require('dotenv').load();
  }
};
