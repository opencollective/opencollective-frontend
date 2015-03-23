module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models')
    , Group = models.Group
    , errors = app.errors
    ;

  /**
   * Public methods.
   */
  return {

    /**
     * Create a group.
     */
    create: function(req, res, next) {
      Group
        .create(req.required['group'])
        .then(function(group) {
          res.send(group.info);
        })
        .catch(next);
    },

  }

};
