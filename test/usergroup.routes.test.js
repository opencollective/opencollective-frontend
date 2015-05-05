/**
 * Dependencies.
 */
var expect    = require('chai').expect
  , request   = require('supertest')
  , _         = require('lodash')
  , app       = require('../index')
  , utils     = require('../test/utils.js')()
  , config    = require('config')
  ;

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

  var application
    , user, user2
    , group
    ;

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

  // Add an admin to the group.
  beforeEach(function(done) {
    group
      .addMember(user, {role: 'admin'})
      .done(done);
  });
  // Add an viewer to the group.
  beforeEach(function(done) {
    group
      .addMember(user3, {role: 'viewer'})
      .done(done);
  });

  /**
   * Add user to a group.
   */
  describe('#addMember', function() {

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

    it('fails adding a user to a group if no admin', function(done) {
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
            expect(groups[0].UserGroup.role).to.equal('viewer');
            done();
          });

        });
    });

    it('successfully add a user to a group with a role', function(done) {
      var role = 'admin';

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
        .get('/users/' + user.id + '/groups?activities=true')
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

  });

});
