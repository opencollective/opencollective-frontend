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
    if (config.env !== 'test_server') {
      return next(new errors.BadRequest('Must only be run on test server'));
    }

    /**
     * Hard code to avoid resetting the production db by mistake
     */
    const sequelize = new Sequelize(
      'dd7n9gp6tr4u36',
      'oshthceeahwmdn',
      'JalG9GcCdddujhfRVlBV5TJRm3', {
        host: 'ec2-54-83-194-117.compute-1.amazonaws.com',
        "port": 5432,
        "dialect": "postgres",
        "protocol": "postgres",
        "logging": true,
        "dialectOptions": {
          "ssl": true
        }
    });

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

      createGroupAndAddUser: ['createTestUser', (cb, results) => {
        models.Group.create({
          name: 'OpenCollective Test Group',
          description: 'OpenCollective test group on the test server',
          slug: 'testcollective',
          isPublic: true
        })
        .then(group => {
          return group.addUser(results.createTestUser, {role: roles.HOST})
        })
        .then(() => cb())
        .catch(cb);
      }],

      createPaypalCard: ['createTestUser', (cb, results) => {
        models.Card.create({ service: 'paypal', UserId: results.createTestUser.id})
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
