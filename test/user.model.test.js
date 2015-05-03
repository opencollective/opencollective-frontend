/**
 * Dependencies.
 */
var expect    = require('chai').expect
  , request   = require('supertest')
  , app       = require('../index')
  , utils     = require('../test/utils.js')()
  ;

/**
 * Variable.
 */
var userData = utils.data('user1');

/**
 * Tests.
 */
describe('user.models.test.js', function() {

  var application, User;

  beforeEach(function() {
    User = app.get('models').User;
  })

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  /**
   * Create a user.
   */
  describe('#create', function() {

    it('fails without email', function(done) {
      User
        .create({ first_name: userData.first_name, last_name: userData.last_name})
        .done(function(err, user) {
          expect(err).to.exist;
          done();
        });

    });

    it('fails if invalid email', function(done) {
      User
        .create({ first_name: userData.first_name, last_name: userData.last_name, email: 'johndoe'})
        .done(function(err, user) {
          expect(err).to.exist;
          done();
        });

    });

    it('successfully creates a user', function(done) {
      var email = 'john.doe@doe.com';
      User
        .create({ first_name: userData.first_name, last_name: userData.last_name, email: userData.email})
        .done(function(err, user) {
          expect(err).to.not.exist;
          expect(user).to.have.property('first_name', userData.first_name);
          expect(user).to.have.property('last_name', userData.last_name);
          expect(user).to.have.property('email', userData.email);
          expect(user).to.have.property('createdAt');
          expect(user).to.have.property('updatedAt');
          done();
        });

    });

  });

  /**
   * Get a user.
   */
  describe('#get', function() {

    beforeEach(function(done) {
      User
        .create(userData)
        .done(done);
    });

    it('successfully get a user', function(done) {
      User.findAndCountAll({}).then(function(res) {
        expect(res.count).to.equal(1);
        expect(res.rows[0].email).to.equal(userData.email);
        done();
      });
    });

  });

});
