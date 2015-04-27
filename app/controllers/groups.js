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
   * Private methods.
   */
  var addGroupMember = function(group, user, options, callback) {
    group
      .addMember(user, {role: options.role})
      .then(function(usergroup) {
        callback();
        
        // Create activities.
        var activity = {
            type: 'group.user.added'
          , GroupId: group.id
          , data: {
                group: group.info
              , user: options.remoteUser.info
              , target: user.info
              , usergroup: usergroup.info
            }
        };
        Activity.create(_.extend({UserId: options.remoteUser.id}, activity));
        Activity.create(_.extend({UserId: user.id}, activity));
      })
      .catch(callback);
  }

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

          // Add caller to the group if `role` specified.
          var role = req.body.role;
          if (role) {
            var options = {
              role: role,
              remoteUser: req.remoteUser
            }
            addGroupMember(group, req.remoteUser, options, function(e) {
              if (e) return next(e);
              else res.send(group.info);
            });
          } else {
            res.send(group.info);
          }
        })
        .catch(next);
    },

    /**
     * Add a user to a group.
     */
    addMember: function(req, res, next) {
      var options = {
        role: req.body.role || 'viewer',
        remoteUser: req.remoteUser
      }
      addGroupMember(req.group, req.user, options, function(e) {
        if (e) return next(e);
        else res.send({success: true});
      });
    }

  }

};
