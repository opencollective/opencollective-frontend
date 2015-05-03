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
describe('groups.routes.test.js', function() {

  var application, user;

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  beforeEach(function(done) {
    models.User.create(userData).done(function(e, u) {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  /**
   * Create.
   */
  describe('#create', function() {

    it('fails creating a group if not authenticated', function(done) {
      request(app)
        .post('/groups')
        .send({
          group: groupData
        })
        .expect(401)
        .end(function(e, res) {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails creating a group without data', function(done) {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(400)
        .end(function(e, res) {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails creating a group without name', function(done) {
      var group = _.omit(groupData, 'name');

      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: group
        })
        .expect(400)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message', 'notNull Violation: name cannot be null');
          expect(res.body.error).to.have.property('type', 'validation_failed');
          expect(res.body.error).to.have.property('fields');
          expect(res.body.error.fields).to.contain('name');
          done();
        });

    });

    it('successfully create a group without assigning a member', function(done) {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: groupData
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('description');
          expect(res.body).to.have.property('membership_type');
          expect(res.body).to.have.property('membershipfee');
          expect(res.body).to.have.property('createdAt');
          expect(res.body).to.have.property('updatedAt');

          user.getGroups().then(function(groups) {
            expect(groups).to.have.length(0);
            done();
          });
        });

    });

    it('successfully create a group assigning the caller as admin', function(done) {
      var role = 'admin';

      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: groupData,
          role: role
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('description');
          expect(res.body).to.have.property('membership_type');
          expect(res.body).to.have.property('membershipfee');
          expect(res.body).to.have.property('createdAt');
          expect(res.body).to.have.property('updatedAt');

          user.getGroups().then(function(groups) {
            expect(groups).to.have.length(1);
            done();
          });
        });

    });

  });

  /**
   * Get.
   */
  describe('#get', function() {

    var group, user2, application2, application3;

    // Create the group.
    beforeEach(function(done) {
      models.Group.create(groupData).done(function(e, g) {
        expect(e).to.not.exist;
        group = g;
        done();
      });
    });

    // Add a user to the group.
    beforeEach(function(done) {
      group
        .addMember(user, {role: 'admin'})
        .done(done);
    });

    // Create another user.
    beforeEach(function(done) {
      models.User.create(utils.data('user2')).done(function(e, u) {
        expect(e).to.not.exist;
        user2 = u;
        done();
      });
    });

    // Create an application which has only access to `group`
    beforeEach(function(done) {
      models.Application.create(utils.data('application2')).done(function(e, a) {
        expect(e).to.not.exist;
        application2 = a;
        application2.addGroup(group).done(done);
      });
    });

    // Create an application which doesn't have access to any group
    beforeEach(function(done) {
      models.Application.create(utils.data('application3')).done(function(e, a) {
        expect(e).to.not.exist;
        application3 = a;
        done();
      });
    });


    it('fails getting a group if not authenticated', function(done) {
      request(app)
        .get('/groups/' + group.id)
        .expect(401)
        .end(done);
    });

    it('fails getting a group if the user authenticated has no access', function(done) {
      request(app)
        .get('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully get a group if authenticated as a user', function(done) {
      request(app)
        .get('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', group.id);
          expect(res.body).to.have.property('name', group.name);
          expect(res.body).to.have.property('description', group.description);
          done();
        });
    });

    it('fails getting a group if the application authenticated has no access', function(done) {
      request(app)
        .get('/groups/' + group.id)
        .send({
          api_key: application3.api_key
        })
        .expect(403)
        .end(done);
    });

    it('successfully get a group if authenticated as a group', function(done) {
      request(app)
        .get('/groups/' + group.id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end(done);
    });

  });

});
