/**
 * Dependencies.
 */
var utils = require('../lib/utils');
var _ = require('lodash');

/**
 * Controller.
 */
module.exports = (app) => {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');
  var Activity = models.Activity;

  /**
   * Public methods.
   */
  return {

    /**
     * Get group's activities.
     */
    group(req, res, next) {
      var query = _.merge({
        where: {
          GroupId: req.group.id
        },
        order: [[req.sorting.key, req.sorting.dir]]
      }, req.pagination);

      Activity
        .findAndCountAll(query)
        .then((activities) => {

          // Set headers for pagination.
          req.pagination.total = activities.count;
          res.set({
            Link: utils.getLinkHeader(utils.getRequestedUrl(req),
                                        req.pagination)
          });

          res.send(activities.rows);
        })
        .catch(next);
    },

    /**
     * Get user's activities.
     */
    user: function(req, res, next) {
      var query = _.merge({
        where: {
          UserId: req.user.id
        },
        order: [[req.sorting.key, req.sorting.dir]]
      }, req.pagination);

      Activity
        .findAndCountAll(query)
        .then((activities) => {

          // Set headers for pagination.
          req.pagination.total = activities.count;
          res.set({
            Link: utils.getLinkHeader(utils.getRequestedUrl(req),
                                        req.pagination)
          });

          res.send(activities.rows);
        })
        .catch(next);
    }

  };

};
