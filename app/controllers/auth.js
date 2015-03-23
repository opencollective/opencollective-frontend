module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models')
    , User = models.User
    , errors = app.errors
    ;

  /**
   * Public methods.
   */
  return {

    /**
     * Authenticate by password.
     */
    byPassword: function(req, res, next) {
      if (!req.remoteUser)
        return next(new errors.BadRequest('Invalid username/email or password'));

      req.user = req.remoteUser;
      next();
    },

  }

};
