/**
 * Dependencies.
 */
var expect    = require('chai').expect
  , request   = require('supertest')
  , _         = require('underscore')
  , app       = require('../index')
  , utils     = require('../test/utils.js')()
  , config    = require('config')
  ;

/**
 * Variables.
 */
var userData = utils.data('user1');
var models = app.set('models');

/**
 * Tests.
 */
describe('users.routes.test.js', function() {

  beforeEach(function(done) {
    utils.cleanAllDb(done);
  });

  describe('#create', function() {

    it('fails if no api_key', function(done) {
      request(app)
        .post('/users')
        .send({
            user: userData
        })
        .expect(400)
        .end(done);
    });

    it('fails if no user object', function(done) {
      request(app)
        .post('/users')
        .send({
            api_key: config.application.api_key
        })
        .expect(400)
        .end(done);
    });

    it('fails if no email', function(done) {
      request(app)
        .post('/users')
        .send({
            api_key: config.application.api_key
          , user: _.omit(userData, 'email')
        })
        .expect(400)
        .end(done);
    });

    it('fails if bad email', function(done) {
      request(app)
        .post('/users')
        .send({
            api_key: config.application.api_key
          , user: _.extend({}, userData, {email: 'abcdefg'})
        })
        .expect(400)
        .end(done);
    });

    it('successfully create a user', function(done) {
      request(app)
        .post('/users')
        .send({
            api_key: config.application.api_key
          , user: userData
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('email', userData.email);
          expect(res.body).to.not.have.property('_salt');
          expect(res.body).to.not.have.property('password');
          expect(res.body).to.not.have.property('password_hash');
          done();
        });
    });

    describe('duplicate', function() {

      beforeEach(function(done) {
        models.User.create(userData).finally(done);
      });

      it('fails to create a user with the same email', function(done) {
        request(app)
          .post('/users')
          .send({
              api_key: config.application.api_key
            , user: _.pick(userData, 'email')
          })
          .expect(400)
          .end(done);
      });

      it('fails to create a user with the same username', function(done) {
        var u = {
            email: 'newemail@email.com'
          , username: userData.username
        }
        request(app)
          .post('/users')
          .send({
              api_key: config.application.api_key
            , user: u
          })
          .expect(400)
          .end(done);
      });

    });

  });

});
