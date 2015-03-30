/**
 * Dependencies.
 */
var _ = require('lodash');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models')
    , Group = models.Group
    , Activity = models.Activity
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

          // Create activity.
          Activity.create({
              type: 'group.created'
            , UserId: req.remoteUser.id
            , GroupId: group.id
            , data: {
                  group: group.info
                , user: req.remoteUser.info
              }
          });
        })
        .catch(next);
    },

    /**
     * Add a user to a group.
     */
    addMember: function(req, res, next) {
      var role = req.body.role || 'viewer';
      
      req.group
        .addMember(req.user, {role: role})
        .then(function(usergroup) {
          res.send({success: true});
          
          // Create activities.
          var activity = {
              type: 'group.user.added'
            , GroupId: req.group.id
            , data: {
                  group: req.group.info
                , user: req.remoteUser.info
                , target: req.user.info
                , usergroup: usergroup.info
              }
          };
          Activity.create(_.extend({UserId: req.remoteUser.id}, activity));
          Activity.create(_.extend({UserId: req.user.id}, activity));
        })
        .catch(next);
    }

  }

};
