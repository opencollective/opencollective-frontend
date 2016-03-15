const async = require('async');
const config = require('config');
const Sequelize = require('sequelize');
const setupModels = require('../models').setupModels;
//const utils = require('../../test/utils.js')();

module.exports = function(app) {

  var errors = app.errors;
  /**
   * This resets the test-api database (and only the test-api database)
   */
  var resetTestDatabase = function(req, res, next) {

    // Check to make sure this is the test_server
    if (config.env !== 'test_server' && config.env !== 'circleci_test_server') {
      return next(new errors.BadRequest('Must only be run on test server'));
    }

    // Hard code to avoid resetting the production db by mistake
    const databaseName = config.env === 'test_server'
      ? 'opencollective_test'
      : 'dd7n9gp6tr4u36';

    const sequelize = new Sequelize(
      databaseName,
      config.database.username,
      config.database.password,
      config.database.options
    );

    const models = setupModels(sequelize);

    const apiKey = '0ac43519edcf4421d80342403fb5985d';
    const roles = require('../constants/roles');

    const testUser = {
      email: 'testuser@opencollective.com',
      password: 'password'
    };

    async.auto({
      resetDb: (cb) => {
        sequelize.sync({force: true})
          .done(cb);
      },

      createApplication: ['resetDb', (cb) => {
        models.Application.create({
          name: 'test_server',
          api_key: apiKey,
          _access: 1
        })
        .done(cb);
      }],

      createTestUser: ['createApplication', (cb) => {
        models.User.create(testUser)
        .done(cb);
      }],

      createStripeAccount: ['createTestUser', (cb, results) => {
        models.StripeAccount.create({
          accessToken: 'sk_test_WhpjxwngkrwC7S0A3AMTKjTs',
          refreshToken: 'rt_7imjrsTAPAcFc8koqCWKDEI8PNd3bumf102Z975H3E11mBWE',
          stripePublishableKey: 'pk_test_M41BhQOKfRljIeHUJUXjA6YC',
          stripeUserId: 'acct_17TL97HrqFRlDDP2',
          scope: 'read_write'
        })
        .then(stripeAccount => {
          return results.createTestUser.setStripeAccount(stripeAccount);
        })
        .done(cb);
      }],

      createGroup: ['createTestUser', (cb) => {
        models.Group.create({
          name: 'OpenCollective Test Group',
          description: 'OpenCollective test group on the test server',
          slug: 'testcollective',
          currency: 'EUR',
          isPublic: true
        })
        .done(cb);
      }],

      addUserToGroup: ['createGroup', (cb, results) => {
        const group = results.createGroup;
        group.addUserWithRole(results.createTestUser, roles.HOST)
          .then(() => cb())
          .catch(cb)
      }],

      createPaypalCard: ['createTestUser', (cb, results) => {
        models.Card.create({ service: 'paypal', UserId: results.createTestUser.id})
        .then(() => cb())
        .catch(cb);
      }],

      addDonation1: ['createGroup', (cb, results) => {
        models.Transaction.create({
          "description": "Donation 1",
          "amount": 1,
          "tags": ['Donation'],
          "currency": "EUR",
          "paidby": "@semdubois",
          "createdAt": "2016-02-29T08:00:00.000Z",
          "UserId": 1
        })
        .then(t => t.setGroup(results.createGroup))
        .then(() => cb())
        .catch(cb);
      }],

      addDonation2: ['createGroup', (cb, results) => {
        models.Transaction.create({
          "description": "Donation 2",
          "amount": 2,
          "tags": ['Donation'],
          "currency": "EUR",
          "paidby": "@semdubois",
          "createdAt": "2016-03-01T08:00:00.000Z",
          "UserId": 1
        })
        .then(t => t.setGroup(results.createGroup))
        .then(() => cb())
        .catch(cb);
      }],

      addExpense1: ['createGroup', (cb, results) => {
        models.Transaction.create({
          "description": "Expense 1",
          "amount": -1,
          "currency": "EUR",
          "paidby": "@semdubois",
          "createdAt": "2016-02-29T08:00:00.000Z"
        })
        .then(t => t.setGroup(results.createGroup))
        .then(() => cb())
        .catch(cb);
      }],

      addExpense2: ['createGroup', (cb, results) => {
        models.Transaction.create({
          "description": "Expense 2",
          "amount": -2,
          "currency": "EUR",
          "paidby": "@semdubois",
          "createdAt": "2016-03-01T08:00:00.000Z"
        })
        .then(t => t.setGroup(results.createGroup))
        .then(() => cb())
        .catch(cb);
      }]
    }, (err) => {
      if (err) {
        return next(err);
      } else {
        res.send({
          success: true
        });
      }
    });
  }

  var generateTestEmail = function(req, res) {
    var emailLib = require('../lib/email')(app);
    // TODO: figure out why test.utils doesn't work here.
    data = require('../../test/mocks/data.json')['emailData'];
    const html = emailLib.templates[req.params.template](data);
    res.send(html);
    emailLib.reload();
  }

  /**
   * Public methods.
   */

  return {
    resetTestDatabase: resetTestDatabase,
    generateTestEmail: generateTestEmail
  };

};
