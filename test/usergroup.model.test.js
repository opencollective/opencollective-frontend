/**
 * Dependencies.
 */
var app = require('../index');
var expect = require('chai').expect;
var utils = require('../test/utils.js')();

/**
 * Variable.
 */
var userData = utils.data('user1');
var groupData = utils.data('group1');

var models = app.get('models');

var User = models.User;
var Group = models.Group;
var Subscription = models.Subscription;

/**
 * Tests.
 */
describe(require('path').basename(__filename), function() {

  var application;
  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  var user;
  var group;
  beforeEach(function(done) {
    User
      .create(userData).then(function(u) {
        user = u;
        return Group.create(groupData);
      })
      .then(function(g) {
        group = g;
      })
      .done(done);
  });

  it.only('automatically subscribe the admin user to the `group.transaction.created` notifications', function(done) {
    var verifyUserSuscribedToGroup = function(userGroup) {
      return Subscription
        .find({ where: {
          UserId: userGroup.UserId,
          GroupId: userGroup.GroupId,
          type: 'group.transaction.created'
        }})
        .then(function(subscription) {
          expect(subscription).to.exist;
        });
    };

    group
      .addMember(user, {role: 'admin'})
      .then(verifyUserSuscribedToGroup)
      .done(done);
  });
});
