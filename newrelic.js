/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name : ['opencollective-api'],
  /**
   * Your New Relic license key.
   */
  license_key : '84d05c81cd801fab6922524a4667accf8cd54b19',
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : 'warn'
  },
  /**
   * Error collector variables.
   */
  error_collector : {
    ignore_status_codes : []
  },
  // other configuration
  rules : {
    ignore : [
      '^/socket.io/.*/xhr-polling',
      '^/socket.io/.*/jsonp-polling',
      '^/socket.io/.*/htmlfile'
    ]
  }
};
