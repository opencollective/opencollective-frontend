/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var config = require('config');
var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('supertest');
var utils = require('../test/utils.js')();

/**
 * Variables.
 */
var userData = utils.data('user1');
var paypalCard = utils.data('card1');
var stripeCard = utils.data('card2');
var models = app.set('models');

/**
 * Tests.
 */
describe('cards.routes.test.js', function() {

  var application;
  var user;
  var user2;
  var card1;
  var sandbox = sinon.sandbox.create();


  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
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

  // Create card.
  beforeEach(function(done) {
    var data = _.extend(paypalCard, { UserId: user.id });
    models.Card.create(data).done(function(e, c) {
      expect(e).to.not.exist;
      card1 = c;
      done();
    });
  });

  beforeEach(function(done) {
    var data = _.extend(stripeCard, { UserId: user.id });
    models.Card.create(data).done(function(e, c) {
      expect(e).to.not.exist;
      card2 = c;
      done();
    });
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Get user's groups.
   */
  describe('#getUserGroups', function() {

    it('fails getting another user\'s cards', function(done) {
      request(app)
        .get('/users/' + user.id + '/cards')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(function(e, res) {
          expect(e).to.not.exist;
          done();
        });
    });

    it('successfully get a user\'s card', function(done) {
      request(app)
        .get('/users/' + user.id + '/cards')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;

          var body = res.body;
          expect(body).to.have.length(2);
          expect(body[0].id).to.be.equal(card1.id);
          expect(body[0].service).to.be.equal(card1.service);
          expect(body[0].token).to.be.equal(card1.token);
          done();
        });
    });

    it('successfully get a user\'s card and filters by service', function(done) {
      request(app)
        .get('/users/' + user.id + '/cards')
        .query({
          filter: {
            service: 'paypal'
          }
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          var body = res.body;

          expect(body).to.have.length(1);
          expect(body[0].id).to.be.equal(card1.id);
          expect(body[0].service).to.be.equal(card1.service);
          expect(body[0].token).to.be.equal(card1.token);
          done();
        });
    });

  });
});
