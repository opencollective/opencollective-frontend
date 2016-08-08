const async = require('async');
const config = require('config');
const Sequelize = require('sequelize');
const setupModels = require('../models').setupModels;
//const utils = require('../../test/utils.js')();

module.exports = function(app) {

  const errors = app.errors;
  /**
   * This resets the test-api database (and only the test-api database)
   */
  const resetTestDatabase = function(req, res, next) {

    // Hard code database name to avoid resetting the production db by mistake
    var databaseName;
    switch (process.env.NODE_ENV) {
      case 'circleci':
        databaseName = 'circle_test';
        break;
      case 'development':
        databaseName = 'opencollective_test';
        break;
      default:
        return next(new errors.BadRequest(`Unsupported NODE_ENV ${process.env.NODE_ENV} for reset API`));
    }

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
          .then(() => cb())
          .catch(cb);
      },

      createApplication: ['resetDb', (cb) => {
        models.Application.create({
          name: 'test_server',
          api_key: apiKey,
          _access: 1
        })
          .then(() => cb())
          .catch(cb);
      }],

      createTestUser: ['createApplication', (cb) => {
        models.User.create(testUser)
          .then(u => cb(null, u))
          .catch(cb);
      }],

      createStripeAccount: ['createTestUser', (cb, results) => {
        models.StripeAccount.create({
          accessToken: 'sk_test_WhpjxwngkrwC7S0A3AMTKjTs',
          refreshToken: 'rt_7imjrsTAPAcFc8koqCWKDEI8PNd3bumf102Z975H3E11mBWE',
          stripePublishableKey: 'pk_test_M41BhQOKfRljIeHUJUXjA6YC',
          stripeUserId: 'acct_17TL97HrqFRlDDP2',
          scope: 'read_write'
        })
        .then(stripeAccount => results.createTestUser.setStripeAccount(stripeAccount))
        .then(stripeAccount => cb(null, stripeAccount))
        .catch(cb);
      }],

      createConnectedAccount: ['createTestUser', (cb, results) => {
        models.ConnectedAccount.create({
          provider: 'paypal',
          // Sandbox api keys
          clientId: 'AZaQpRstiyI1ymEOGUXXuLUzjwm3jJzt0qrI__txWlVM29f0pTIVFk5wM9hLY98w5pKCE7Rik9QYvdYA',
          secret: 'EILQQAMVCuCTyNDDOWTGtS7xBQmfzdMcgSVZJrCaPzRbpGjQFdd8sylTGE-8dutpcV0gJkGnfDE0PmD8'
        })
        .then((connectedAccount) => connectedAccount.setUser(results.createTestUser))
        .then(() => cb())
        .catch(cb);
      }],

      createGroup: ['createTestUser', (cb) => {
        models.Group.create({
          name: 'OpenCollective Test Group',
          description: 'OpenCollective test group on the test server',
          slug: 'testcollective',
          mission: 'our awesome mission',
          tags: ['open source'],
          currency: 'EUR',
          isPublic: true
        })
        .then(group => cb(null, group))
        .catch(cb);
      }],

      addUserToGroup: ['createGroup', (cb, results) => {
        const group = results.createGroup;
        group.addUserWithRole(results.createTestUser, roles.HOST)
          .then(() => cb())
          .catch(cb)
      }],

      createPaypalPaymentMethod: ['createTestUser', (cb, results) => {
        models.PaymentMethod.create({ service: 'paypal', UserId: results.createTestUser.id})
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
          "UserId": 1
        })
        .then(t => t.setGroup(results.createGroup))
        .then(() => cb())
        .catch(cb);
      }],

      addDonation2: ['createGroup', 'addDonation1', (cb, results) => {
        models.Transaction.create({
          "description": "Donation 2",
          "amount": 2,
          "tags": ['Donation'],
          "currency": "EUR",
          "paidby": "@semdubois",
          "UserId": 1
        })
        .then(t => t.setGroup(results.createGroup))
        .then(() => cb())
        .catch(cb);
      }],

      addExpense1: ['createGroup', (cb, results) => {
        models.Expense.create({
          "title": "Expense 1",
          "amount": 100,
          "currency": "EUR",
          "incurredAt": "2016-02-29T08:00:00.000Z",
          "createdAt": "2016-02-29T08:00:00.000Z",
          "GroupId": results.createGroup.id,
          "UserId": results.createTestUser.id,
          "lastEditedById": results.createTestUser.id,
          "payoutMethod": 'paypal'
        })
        .then(() => cb())
        .catch(cb);
      }],

      addExpense2: ['createGroup', (cb, results) => {
        models.Expense.create({
          "title": "Expense 2",
          "amount": 200,
          "currency": "EUR",
          "incurredAt": "2016-03-01T08:00:00.000Z",
          "createdAt": "2016-03-01T08:00:00.000Z",
          "GroupId": results.createGroup.id,
          "UserId": results.createTestUser.id,
          "lastEditedById": results.createTestUser.id,
          "payoutMethod": 'manual'
        })
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

  const generateTestEmail = function(req, res) {
    const emailLib = require('../lib/email');
    const template = req.params.template;
    try {
      const data = JSON.parse(req.query.data);
      console.log(`Generating ${template} with data`, data);
      const html = emailLib.templates[template](data);
      res.send(html);
      emailLib.reload();
    } catch (e) {
      res.send("Invalid data", e);
    }
  }

  /**
   * Public methods.
   */

  return {
    resetTestDatabase: resetTestDatabase,
    generateTestEmail: generateTestEmail
  };

};
