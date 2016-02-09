/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var config = require('config');
var expect = require('chai').expect;
var jwt = require('jsonwebtoken');
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
describe('auth.routes.test.js', function() {

  var application;

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  beforeEach(function(done) {
    models.User.create(userData).done(done);
  });

  describe('#authenticate', function() {

    it('fails authenticate if no password', function(done) {
      request(app)
        .post('/authenticate')
        .send({
          api_key: application.api_key,
          username: userData.username
        })
        .expect(400)
        .end(function(e, res) {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails authenticate if bad application', function(done) {
      request(app)
        .post('/authenticate')
        .send({
          api_key: 'bla',
          username: userData.username,
          password: userData.password
        })
        .expect(401)
        .end(function(e, res) {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails authenticate if bad password', function(done) {
      request(app)
        .post('/authenticate')
        .send({
          api_key: application.api_key,
          username: userData.username,
          password: 'bad'
        })
        .expect(400)
        .end(function(e, res) {
          expect(e).to.not.exist;
          done();
        });
    });

    it('successfully authenticate with username', function(done) {
      request(app)
        .post('/authenticate')
        .send({
          api_key: application.api_key,
          username: userData.username,
          password: userData.password
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('access_token');
          expect(res.body).to.have.property('refresh_token');
          var data = jwt.decode(res.body.access_token);
          expect(data).to.have.property('id');
          expect(data).to.have.property('username');
          expect(data).to.have.property('name');
          expect(data).to.have.property('iat');
          expect(data).to.have.property('exp');
          expect(data).to.have.property('aud');
          expect(data).to.have.property('iss');
          expect(data).to.have.property('sub');
          done();
        });
    });

    it('successfully authenticate with email (case insensitive)', function(done) {
      request(app)
        .post('/authenticate')
        .send({
          api_key: application.api_key,
          email: userData.email.toUpperCase(),
          password: userData.password
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('access_token');
          expect(res.body).to.have.property('refresh_token');
          done();
        });
    });

  });

});
