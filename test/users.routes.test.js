/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var config = require('config');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();

/**
 * Variables.
 */
var userData = utils.data('user1');
var models = app.set('models');

/**
 * Tests.
 */
describe('users.routes.test.js', function() {

  var application;
  var application2;
  var application3;

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
        .expect(400)
        .end(done);
    });

    it('fails if no api_key', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application2.api_key,
          user: userData
        })
        .expect(403)
        .end(done);
    });

    it('fails if no user object', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key
        })
        .expect(400)
        .end(done);
    });

    it('fails if no email', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.omit(userData, 'email')
        })
        .expect(400)
        .end(done);
    });

    it('fails if bad email', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.extend({}, userData, {email: 'abcdefg'})
        })
        .expect(400)
        .end(done);
    });

    it('fails if @ symbol in twitterHandle', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: _.extend({}, userData, {twitterHandle: '@asood123'})
        })
        .expect(400)
        .end(done);
    });

    it('successfully create a user', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application.api_key,
          user: userData
        })
        .expect(200)
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

    it('successfully create a user with an application that has access [0.5]', function(done) {
      request(app)
        .post('/users')
        .send({
          api_key: application3.api_key,
          user: userData
        })
        .expect(200)
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
          .expect(400)
          .end(done);
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
          .expect(400)
          .end(done);
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
        .expect(200)
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
        .expect(200)
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
        .expect(200)
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
        .expect(401)
        .end(done);
    });

    it('fails if the email is not valid', function(done) {
      request(app)
        .put('/users/' + user.id + '/paypalemail')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          paypalEmail: 'abc'
        })
        .expect(400)
        .end(done);
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
        .expect(200)
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
        .expect(401)
        .end(done);
    });

    it('fails if wrong user is logged in', function(done) {
      request(app)
        .put('/users/' + user.id + '/password')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
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
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'password and passwordConfirmation don\'t match'
          }
        })
        .end(done);
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
        .expect(200)
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
        .expect(401)
        .end(done);
    });

    it('fails if the avatar key is missing from the payload', function(done) {
      request(app)
        .put('/users/' + user.id + '/avatar')
        .send({})
        .expect(400)
        .end(done);
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
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Can\'t update user with password from this route'
          }
        })
        .end(done);
    });

    it('successfully updates a user without a password', done => {
      request(app)
        .put('/users/' + userWithoutPassword.id)
        .send({
          user: newUser,
          api_key: application.api_key
        })
        .expect(200)
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
