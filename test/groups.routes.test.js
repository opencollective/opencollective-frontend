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

});
