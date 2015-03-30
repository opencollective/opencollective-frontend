/**
 * Dependencies.
 */
var utils = require('../lib/utils');
var _ = require('underscore');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');
  var Activity = models.Activity;
  var errors = app.errors;

  /**
   * Public methods.
   */
  return {

    /**
     * Get group's activities.
     */
    group: function(req, res, next) {

      // var options = _.extend(pagination, 
      //   {sort: req.query.sort},
      //   {since_id: req.query.since_id}
      // );

      var query = _.extend({
        where: {
          GroupId: req.group.id
        }
      }, req.pagination);

      console.log('query : ', query);

      Activity // req.group.getActivities doesn't support pagination yet. [https://github.com/sequelize/sequelize/issues/3404]
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
    },

    /**
     * Get user's activities.
     */
    user: function(req, res, next) {

    }

  }

};
