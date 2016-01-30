/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var config = require('config');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();
var userlib = require('../app/lib/userlib');
var sinon = require('sinon');
var Bluebird = require('bluebird');

/**
 * Variables.
 */
var userData = utils.data('user1');
var models = app.set('models');
var mock = require('./mocks/clearbit.json');

/**
 * Tests.
 */
describe('users.routes.test.js', function() {

  var application;
  var application2;
  var application3;

  var sandbox, stub;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    userlib.memory = {};
    stub = sandbox.stub(userlib.clearbit.Enrichment, 'find', (opts) => {
      return new Bluebird((resolve, reject) => {
        if(opts.email == "xdamman@gmail.com") {
          return resolve(mock);
        }
        else {
          var NotFound = new userlib.clearbit.Enrichment.NotFoundError(' NotFound');
          reject(NotFound);
        }
      });
    });
  });

  afterEach(() => sandbox.restore() );

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  // Create a normal application.
  beforeEach(function(done) {
    models.Application.create(utils.data('application2')).done(function(e, a) {
      expect(e).to.not.exist;
      application2 = a;
      done();
    });
  });

  // Create an application with user creation access.
  beforeEach(function(done) {
    models.Application.create(utils.data('application3')).done(function(e, a) {
      expect(e).to.not.exist;
      application3 = a;
      done();
    });
  });

  /**
   * Create.
   */
  describe('#create', function() {

    it('fails if no api_key', function(done) {
      request(app)
        .post('/users')
        .send({
          user: userData
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('missing_required');
          done();
        });
    });

    it('fails if no api_key', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application2.api_key,
          user: userData
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(403);
          expect(res.body.error.type).to.equal('forbidden');
          done();
        });
    });

    it('fails if no user object', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('missing_required');
          done();
        });
    });

    it('fails if no email', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.omit(userData, 'email')
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('validation_failed');
          done();
        });
    });

    it('fails if bad email', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.extend({}, userData, {email: 'abcdefg'})
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('validation_failed');
          done();
        });
    });

    it('fails if @ symbol in twitterHandle', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.extend({}, userData, {twitterHandle: '@asood123'})
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('validation_failed');
          done();
        });
    });

    it('successfully create a user', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: userData
        })
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('email', userData.email);
          expect(res.body).to.not.have.property('_salt');
          expect(res.body).to.not.have.property('password');
          expect(res.body).to.not.have.property('password_hash');
          models.User
            .find(parseInt(res.body.id))
            .then(function(user) {
              expect(user).to.have.property('ApplicationId', application.id);
              done();
            })
            .catch(done);
        });
    });
    
    it('successfully create a user with just an email and auto prefills name, twitter, avatar', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: { email: "xdamman@gmail.com" }
        })
        .end(function(e, res) {
          expect(e).to.not.exist;
          models.User
            .find(parseInt(res.body.id))
            .then(function(user) {
              expect(user.name).to.equal("Xavier Damman");
              expect(user.twitterHandle).to.equal("xdamman");
              done();
            })
            .catch(done);
        });
    });

    it('successfully create a user with an application that has access [0.5]', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application3.api_key,
          user: userData
        })
        .end(function(e, res) {
          expect(e).to.not.exist;
          models.User
            .find(parseInt(res.body.id))
            .then(function(user) {
              expect(user).to.have.property('ApplicationId', application3.id);
              done();
            })
            .catch(done);
        });
    });

    describe('duplicate', function() {

      beforeEach(function(done) {
        models.User.create(userData).done(done);
      });

      it('fails to create a user with the same email', function(done) {
        request(app)
          .post('/users')
          .send({
            api_key: application.api_key,
            user: _.pick(userData, 'email')
          })
          .end((e,res) => {
            expect(res.statusCode).to.equal(400);
            expect(res.body.error.type).to.equal('validation_failed');
            done();
          });
      });

      it('fails to create a user with the same username', function(done) {
        var u = {
          email: 'newemail@email.com', username: userData.username
        }
        request(app)
          .post('/users')
          .send({
            api_key: application.api_key,
            user: u
          })
          .end((e,res) => {
            expect(res.statusCode).to.equal(400);
            expect(res.body.error.type).to.equal('validation_failed');
            done();
          });
      });

    });

  });

  /**
   * Get.
   */
  describe('#get()', function() {

    var user;
    var user2;

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
        done(e);
      });
    });

    it('successfully get a user\'s information', function(done) {
      request(app)
        .get('/users/' + user.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .end(function(e, res) {
          expect(e).to.not.exist;
          var u = res.body;
          expect(u.username).to.equal(utils.data('user1').username);
          expect(u).to.not.have.property('email');
          done();
        });
    });

    it('successfully get a user\'s information when he is authenticated', function(done) {
      request(app)
        .get('/users/' + user.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .end(function(e, res) {
          expect(e).to.not.exist;
          var u = res.body;
          expect(u.username).to.equal(utils.data('user1').username);
          expect(u.email).to.equal(utils.data('user1').email);
          done();
        });
    });

  });

  describe('#update paypal email', function() {
    var user;

    beforeEach(function(done) {
      models.User.create(utils.data('user1')).done(function(e, u) {
        expect(e).to.not.exist;
        user = u;
        done();
      });
    });

    it('should update the paypal email', function(done) {
      var email = 'test+paypal@email.com';
      request(app)
        .put('/users/' + user.id + '/paypalemail')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          paypalEmail: email
        })
        .end(function(err, res) {
          var body = res.body;
          expect(body.paypalEmail).to.equal(email);
          done();
        });
    });

    it('fails if the user is not logged in', function(done) {
      var email = 'test+paypal@email.com';
      request(app)
        .put('/users/' + user.id + '/paypalemail')
        .send({
          paypalEmail: email
        })
          .end((e,res) => {
            expect(res.statusCode).to.equal(401);
            expect(res.body.error.type).to.equal('unauthorized');
            done();
          });
    });

    it('fails if the email is not valid', function(done) {
      request(app)
        .put('/users/' + user.id + '/paypalemail')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          paypalEmail: 'abc'
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('validation_failed');
          done();
        });
    });
  });

  describe('#update password', () => {
    var user;
    var user2;

    beforeEach((done) => {
      models.User.create(utils.data('user1')).done((e, u) => {
        expect(e).to.not.exist;
        user = u;
        done();
      });
    });

    beforeEach((done) => {
      models.User.create(utils.data('user2')).done((e, u) => {
        expect(e).to.not.exist;
        user2 = u;
        done();
      });
    });

    it('should update password', (done) => {
      const newPassword = 'aaa123';

      request(app)
        .put('/users/' + user.id + '/password')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          password: newPassword,
          passwordConfirmation: newPassword
        })
        .end(function(err, res) {
          var body = res.body;
          expect(body.success).to.equal(true);
          models.User.auth(user.email, newPassword, e => {
            expect(e).to.not.exist;
            done();
          });
        });
    });

    it('fails if the user is not logged in', function(done) {
      request(app)
        .put('/users/' + user.id + '/password')
        .end((e,res) => {
          expect(res.statusCode).to.equal(401);
          expect(res.body.error.type).to.equal('unauthorized');
          done();
        });
    });

    it('fails if wrong user is logged in', function(done) {
      request(app)
        .put('/users/' + user.id + '/password')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .end((e,res) => {
          expect(res.statusCode).to.equal(403);
          expect(res.body.error.type).to.equal('forbidden');
          done();
        });
    });

    it('fails if the passwords don\'t match', function(done) {
      const newPassword = 'aaa123';

      request(app)
        .put('/users/' + user.id + '/password')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          password: newPassword,
          passwordConfirmation: newPassword + 'a'
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('bad_request');
          expect(res.body.error.message).to.equal('password and passwordConfirmation don\'t match');
          done();
        });
    });

  });

  describe('#update avatar', function() {
    var user;

    beforeEach(function(done) {
      models.User.create(utils.data('user1')).done(function(e, u) {
        expect(e).to.not.exist;
        user = u;
        done();
      });
    });

    it('should update avatar', function(done) {
      var link = 'http://opencollective.com/assets/icon2.svg';
      request(app)
        .put('/users/' + user.id + '/avatar')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          avatar: link
        })
        .end(function(err, res) {
          var body = res.body;
          expect(body.avatar).to.equal(link);
          done();
        });
    });

    it('fails if the user is not logged in', function(done) {
      var link = 'http://opencollective.com/assets/icon2.svg';
      request(app)
        .put('/users/' + user.id + '/avatar')
        .send({
          avatar: link
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(401);
          expect(res.body.error.type).to.equal('unauthorized');
          done();
        });
    });

    it('fails if the avatar key is missing from the payload', function(done) {
      request(app)
        .put('/users/' + user.id + '/avatar')
        .send({})
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('missing_required');
          done();
        });
    });

  });

  /*
   * Update user (without authentication)
   */

  describe('#update user from public donation page', () => {
    var userWithPassword;
    var userWithoutPassword;

    var newUser = {
      name: 'newname',
      twitterHandle: 'twitter.com/asood123',
      website: 'opencollective.com'
    };

    beforeEach((done) => {
      models.User.create({
        email: 'withpassword@example.com',
        password: 'password'
      })
      .done((e, u) => {
        expect(e).to.not.exist;
        userWithPassword = u;
        done();
      });
    });

    beforeEach((done) => {
      models.User.create({
        email: 'xdamman@gmail.com' // will have twitter avatar
      })
      .done(function(e, u) {
        expect(e).to.not.exist;
        userWithoutPassword = u;
        done();
      });
    });

    it('fails if the user already has a password', done => {
      request(app)
        .put('/users/' + userWithPassword.id)
        .send({
          user: newUser,
          api_key: application.api_key
        })
        .end((e,res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.type).to.equal('bad_request');
          expect(res.body.error.message).to.equal('Can\'t update user with password from this route');
          done();
        });
    });

    it('successfully updates a user without a password', done => {
      request(app)
        .put('/users/' + userWithoutPassword.id)
        .send({
          user: newUser,
          api_key: application.api_key
        })
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', userWithoutPassword.id);
          expect(res.body).to.have.property('name', newUser.name);
          expect(res.body).to.have.property('twitterHandle', newUser.twitterHandle);
          expect(res.body).to.have.property('website', newUser.website);
          expect(res.body).to.have.property('avatar').to.contain('cloudfront');
          done();
        });
    });

  });

});