/**
 * Dependencies.
 */
const cheerio = require('cheerio');
const _ = require('lodash');
const app = require('../index');
const async = require('async');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const expect = require('chai').expect;
const request = require('supertest');
const config = require('config');
const utils = require('../test/utils.js')();
const createTransaction = require('../app/controllers/transactions')(app)._create;

/**
 * Variables.
 */
var models = app.set('models');
var transactionsData = utils.data('transactions1').transactions;
var roles = require('../app/constants/roles');

/**
 * Tests.
 */
describe('subscriptions.routes.test.js', () => {

  var group;
  var user;
  var application;

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  // Create user.
  beforeEach((done) => {
    models.User.create(utils.data('user1')).done((e, u) => {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Create the group.
  beforeEach((done) => {
    models.Group.create(utils.data('group1')).done((e, g) => {
      expect(e).to.not.exist;
      group = g;
      done();
    });
  });


  // Add user to the group.
  beforeEach((done) => {
    group
      .addUserWithRole(user, roles.HOST)
      .done(done);
  });

  /**
   * Get the subscriptions of a user
   */
  describe('#getAll', () => {
    // Create transactions for group1.
    beforeEach((done) => {
      async.map(transactionsData, (transaction, cb) => {
        createTransaction({
          transaction,
          user,
          group: group,
          subscription: utils.data('subscription1')
        }, cb);
      }, done);
    });

    it('fails if the payload does not have the scope', (done) => {
      request(app)
        .get('/subscriptions')
        .set('Authorization', 'Bearer ' + user.jwt(application, {
          scope: ''
        }))
        .expect(401, {
          error: {
            code: 401,
            type: 'unauthorized',
            message: 'User does not have the scope'
          }
        })
        .end(done);
    });

    it('fails if the token expired', (done) => {
      const expiredToken = jwt.sign({
        user,
        scope: 'subscriptions'
      }, config.keys.opencollective.secret, {
        expiresInSeconds: -1,
        subject: user.id,
        issuer: config.host.api,
        audience: application.id
      });

      request(app)
        .get('/subscriptions')
        .set('Authorization', 'Bearer ' + expiredToken)
        .end((err, res) => {
          expect(res.body.error.code).to.be.equal(401);
          expect(res.body.error.message).to.be.equal('jwt expired');
          done();
        });
    });

    it('successfully has access to the subscriptions', (done) => {
      request(app)
        .get('/subscriptions')
        .set('Authorization', 'Bearer ' + user.jwt(application, {
          scope: 'subscriptions'
        }))
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.length).to.be.equal(transactionsData.length);
          res.body.forEach(sub => {
            expect(sub).to.be.have.property('stripeSubscriptionId')
            expect(sub).to.be.have.property('Transactions')
            expect(sub.Transactions[0]).to.be.have.property('Group')
          });
          done();
        });
    });
  });

  /**
   * Send a new link to the user for the subscription page
   */

  describe('#sendTokenByEmail', () => {

    it('fails if there is no auth', (done) => {
      request(app)
        .post('/subscriptions/token')
        .expect(401, {
          error: {
            code: 401,
            message: "Invalid payload",
            type: 'unauthorized'
          }
        })
        .end(done);
    });

    it('fails if the user does not exist', (done) => {
      const fakeUser = { id: 12312312 };
      const expiredToken = jwt.sign({ user: fakeUser }, config.keys.opencollective.secret, {
        expiresInSeconds: 100,
        subject: fakeUser.id,
        issuer: config.host.api,
        audience: application.id
      });

      request(app)
        .post('/subscriptions/token')
        .expect(401, {
          error: {
            code: 401,
            message: "Invalid payload",
            type: 'unauthorized'
          }
        })
        .end(done);
    });

    it('sends an email with the new valid token', (done) => {
      const secret = config.keys.opencollective.secret;
      const expiredToken = jwt.sign({ user }, config.keys.opencollective.secret, {
        expiresInSeconds: -1,
        subject: user.id,
        issuer: config.host.api,
        audience: application.id
      });

      app.mailgun.sendMail = (options) => {
        const $ = cheerio.load(options.html);
        const token = $('a').attr('href').replace('http://localhost:3000/subscriptions/', '');
        jwt.verify(token, secret, done);
      };

      request(app)
        .post('/subscriptions/token/')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(200)
        .end(done);
    });

  });
});
