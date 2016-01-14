/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var config = require('config');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();

/**
 * Variables.
 */
var userData = utils.data('user1');
var groupData = utils.data('group1');
var models = app.set('models');

/**
 * Tests.
 */
describe('usergroup.routes.test.js', function() {

  var application;
  var user;
  var user2;
  var group;

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  // Create users.
  beforeEach(function(done) {
    models.User.create(utils.data('user1')).done(function(e, u) {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  beforeEach(function(done) {
    models.User.create(utils.data('user2')).done(function(e, u) {
      expect(e).to.not.exist;
      user2 = u;
      done();
    });
  });

  beforeEach(function(done) {
    models.User.create(utils.data('user3')).done(function(e, u) {
      expect(e).to.not.exist;
      user3 = u;
      done();
    });
  });

  // Create group.
  beforeEach(function(done) {
    models.Group.create(groupData).done(function(e, g) {
      expect(e).to.not.exist;
      group = g;
      done();
    });
  });

  // Add an host to the group.
  beforeEach(function(done) {
    group
      .addUser(user, {role: 'host'})
      .done(done);
  });

  // Add an backer to the group.
  beforeEach(function(done) {
    group
      .addUser(user3, {role: 'backer'})
      .done(done);
  });

  /**
   * Add user to a group.
   */
  describe('#addUser', function() {

    it('fails adding a non-existing user to a group', function(done) {
      request(app)
        .post('/groups/' + group.id + '/users/' + 98765)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails adding a user to a non-existing group', function(done) {
      request(app)
        .post('/groups/' + 98765 + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails adding a user with a non-existing role', function(done) {
      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .send({
          role: 'nonexistingrole'
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(400)
        .end(done);
    });

    it('fails adding a user to a group if not a member of the group', function(done) {
      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .send({
          role: 'nonexistingrole'
        })
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails adding a user to a group if no host', function(done) {
      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .send({
          role: 'nonexistingrole'
        })
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully add a user to a group', function(done) {
      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          user2.getGroups().then(function(groups) {
            expect(groups[0].id).to.equal(group.id);
            expect(groups[0].UserGroup.role).to.equal('backer');
            done();
          });

        });
    });

    it('successfully add a user to a group with a role', function(done) {
      var role = 'host';

      request(app)
        .post('/groups/' + group.id + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          role: role
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          user2.getGroups().then(function(groups) {
            expect(groups[0].id).to.equal(group.id);
            expect(groups[0].UserGroup.role).to.equal(role);

            setTimeout(function() {
              models.Activity.findAndCountAll({}).then(function(res) {
                expect(res.count).to.equal(2);
                done();
              });
            }, 50);
          });

        });
    });

  });

  /**
   * Get user's groups.
   */
  describe('#getUserGroups', function() {

    beforeEach(function(done) {
      request(app)
        .post('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(done);
    });

    it('fails getting another user\'s groups', function(done) {
      request(app)
        .get('/users/' + user.id + '/groups')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(function(e, res) {
          expect(e).to.not.exist;
          done();
        });
    });

    it('successfully get a user\'s groups', function(done) {
      request(app)
        .get('/users/' + user2.id + '/groups')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(0);
          done();
        });
    });

    it('successfully get a user\'s groups bis', function(done) {
      request(app)
        .get('/users/' + user.id + '/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('description');
          expect(res.body[0]).to.not.have.property('Activities');
          done();
        });
    });

    it('successfully get a user\'s groups with activities', function(done) {
      request(app)
        .get('/users/' + user.id + '/groups?include=activities')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('description');
          expect(res.body[0]).to.have.property('activities');
          expect(res.body[0].activities).to.have.length.above(0);
          done();
        });
    });

    it('successfully get a user\'s groups with the role', function(done) {
      request(app)
        .get('/users/' + user.id + '/groups?include=usergroup.role')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('description');
          expect(res.body[0]).to.have.property('role');
          done();
        });
    });

  });

  /**
   * Update a user-group relation.
   */
  describe('#updateUserGroup', function() {

    it('fails if no access to the group', function(done) {
      request(app)
        .put('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if no host', function(done) {
      request(app)
        .put('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if the user is not part of the group yet', function(done) {
      request(app)
        .put('/groups/' + group.id + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('successfully update a user-group relation', function(done) {
      var role = 'member';
      request(app)
        .put('/groups/' + group.id + '/users/' + user3.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          role: role
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('role', role);

          // Check activities.
          models.Activity.findAndCountAll({where: {type: 'group.user.updated'} }).then(function(res) {
            expect(res.count).to.equal(2);
            done();
          });
        });
    });

  });

  /**
   * Delete a user-group relation.
   */
  describe('#deleteUserGroup', function() {

    it('fails if no access to the group', function(done) {
      request(app)
        .del('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if no host', function(done) {
      request(app)
        .del('/groups/' + group.id + '/users/' + user.id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails if the user is not part of the group yet', function(done) {
      request(app)
        .del('/groups/' + group.id + '/users/' + user2.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('successfully update a user-group relation', function(done) {
      var role = 'member';
      request(app)
        .del('/groups/' + group.id + '/users/' + user3.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          async.parallel([
            function(cb) {
              // Check usergroup.
              var query = {
                where: {
                  GroupId: group.id,
                  UserId: user3.id
                }
              };
              models.UserGroup.findAndCountAll(query).then(function(res) {
                expect(res.count).to.equal(0);
                cb();
              });
            },
            function(cb) {
              // Check activities.
              models.Activity.findAndCountAll({where: {type: 'group.user.deleted'} }).then(function(res) {
                expect(res.count).to.equal(2);
                cb();
              });
            }
          ], done);

        });
    });

  });

});
