/**
 * Dependencies.
 */
var utils = require('../lib/utils');
var _ = require('lodash');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models')
    , User = models.User
    , Activity = models.Activity
    , errors = app.errors
    ;

  /**
   * Private methods.
   */
  var getGroupActivities = function() {
    var query = _.merge({
      where: {
        GroupId: req.group.id
      },
      order: [ [req.sorting.key, req.sorting.dir] ]
    }, req.pagination);

    Activity
      .findAndCountAll(query)
      .then(function(activities) {

        // Set headers for pagination.
        req.pagination.total = activities.count;
        res.set({
          'Link': utils.getLinkHeader(utils.getRequestedUrl(req), req.pagination)
        });

        res.send(activities.rows);
      })
      .catch(next);
  }

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

          Activity.create({
              type: 'user.created'
            , UserId: user.id
            , data: {user: user.info}
          });
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

    /**
     * Get a user's groups.
     */
    getGroups: function(req, res, next) {
      var options = {
        include: []
      };

      if (req.query.activities)
        options.include.push({ model: Activity });

      req.user
        .getGroups(options)
        .then(function(groups) {
          var out = _.map(groups, function(g) {
            var group = g.info;
            group.activities = g.Activities;
            return group;
          })
          res.send(out);
        })
        .catch(next);
    },

  }

};
