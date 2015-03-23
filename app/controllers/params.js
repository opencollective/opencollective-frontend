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

    userid: function(req, res, next, userid) {
      User
        .find(userid)
        .then(function(user) {
          if (!user) {
            return next(new errors.NotFound('User \'' + userid + '\' not found'));
          } else {
            req.user = user;
            next();
          }
        })
        .catch(next);
    },

  }

};
