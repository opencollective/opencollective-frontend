module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');

  /**
   * Public methods.
   */
  return {

    /**
     * Authenticate by password.
     */
    byPassword: function(req, res, next) {
      if (!req.remoteUser) {
        var errorMsg = 'Invalid username/email or password';
        return next(new errors.BadRequest(errorMsg));
      }

      req.user = req.remoteUser;
      next();
    },

  };

};
