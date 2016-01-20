/**
 * Dependencies.
 */
var app = require('../index');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();

/**
 * Variable.
 */
var userData = utils.data('user1');

/**
 * Tests.
 */
describe('user.models.test.js', function() {

  var application;
  var User;

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
        .create({ name: userData.name})
        .done(function(err, user) {
          expect(err).to.exist;
          done();
        });

    });

    it('fails if invalid email', function(done) {
      User
        .create({ name: userData.name, email: 'johndoe'})
        .done(function(err, user) {
          expect(err).to.exist;
          done();
        });

    });

    it('successfully creates a user', function(done) {
      var email = 'john.doe@doe.com';
      User
        .create({ name: userData.name, email: userData.email})
        .done(function(err, user) {
          expect(err).to.not.exist;
          expect(user).to.have.property('name', userData.name);
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

    it('successfully get a user, user.info and user.public return correct information', function(done) {
      User.findOne({}).then(function(user) {
        expect(user.info).to.have.property('email');
        expect(user.info).to.have.property('paypalEmail');
        expect(user.public).to.not.have.property('email');
        expect(user.public).to.not.have.property('paypalEmail');
        expect(user.public).to.have.property('website');
        expect(user.public).to.have.property('twitterHandle');
        expect(user.public.twitterHandle).to.equal(userData.twitterHandle);
        done();
      });
    });

  });

});
