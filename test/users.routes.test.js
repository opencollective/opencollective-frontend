/**
 * Dependencies.
 */
var expect    = require('chai').expect
  , request   = require('supertest')
  , app       = require('../index')
  , utils     = require('../test/utils.js')()
  , config    = require('config')
  ;

/**
 * Variables.
 */
var userData = utils.data('user1');

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
          console.log('res : ', res.body);
          expect(res.body).to.have.property('email', userData.email);
          expect(res.body).to.not.have.property('_salt');
          expect(res.body).to.not.have.property('password');
          expect(res.body).to.not.have.property('password_hash');
          done();
        });
    });

  });

});
