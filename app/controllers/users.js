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
     * Create a user.
     */
    create: function(req, res, next) {
      User
        .create(req.required['user'])
        .then(function(user) {
          res.send(user.info);
        })
        .catch(next);
    },

    /**
     * Get token.
     */
    getToken: function(req, res, next) {
      res.send({
          access_token: req.user.jwt
        , refresh_token: req.user.refresh_token
      });
    },

    /**
     * Show.
     */
    show: function(req, res, next) {
      if (req.remoteUser.id === req.user.id)
        res.send(req.user.info);
      else
        res.send(req.user.show);
    },

  }

};
