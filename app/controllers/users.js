module.exports = function(app) {

  var models = app.set('models');
  var User = models.User;

  return {

  /**
   * Create a user.
   */
  create: function(req, res, next) {
    User
      .create(req.required['user'])
      .success(function(user) {
        res.send(user);
      })
      .error(next);
  }

  }

};
