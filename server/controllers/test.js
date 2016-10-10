import async from 'async';
import config from 'config';
import Sequelize from 'sequelize';
import { setupModels } from '../models';
import roles from '../constants/roles';
import emailLib from '../lib/email';
import errors from '../lib/errors';

/**
 * This resets the test-api database (and only the test-api database)
 */
export const resetTestDatabase = function(req, res, next) {

  // Hard code database name to avoid resetting the production db by mistake
  let databaseName;
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
  const testUser = {
    email: 'testuser@opencollective.com',
    password: 'password'
  };
  const member = {
    email: 'member@opencollective.com',
    firstName: 'Xavier',
    lastName: 'Damman'
  }
  const backer = {
    email: 'backer@opencollective.com',
    firstName: 'Aseem',
    lastName: 'Sood'
  }
  const backer2 = {
    email: 'backer2@opencollective.com',
    firstName: 'Pia',
    lastName: 'Mancini'
  }

  async.auto({
    resetDb: (cb) => {
      sequelize.sync({force: true})
        .then(() => cb())
        .catch(cb);
    },

    createGroup: ['resetDb', (cb) => {
      models.Group.create({
        name: 'OpenCollective Test Group',
        description: 'OpenCollective test group on the test server',
        slug: 'testcollective',
        mission: 'our awesome mission',
        tags: ['open source'],
        tiers: [
          {"name":"backer","title":"Backers","description":"Support us with a monthly donation and help us continue our activities.","button":"Become a backer","range":[1,100000],"presets":[1,5,10,25,50],"interval":"monthly"},
          {"name":"sponsor","title":"Sponsors","description":"Is your company using Mocha? Ask your manager to support us. Your company logo will show up on our Github page.","button":"Become a sponsor","range":[500,500000],"presets":[500,1000],"interval":"monthly"}
        ],
        currency: 'EUR',
        isPublic: true
      })
      .then(group => cb(null, group))
      .catch(cb);
    }],

    createTestUser: ['createGroup', (cb, results) => {
      models.User.create(testUser)
        .tap(u => results.createGroup.addUserWithRole(u, roles.HOST))
        .then(u => cb(null, u))
        .catch(cb);
    }],

    createMember: ['createGroup', (cb, results) => {
      models.User.create(member)
        .tap(u => results.createGroup.addUserWithRole(u, roles.MEMBER))
        .then(u => cb(null, u))
        .catch(cb);
    }],

    createBacker: ['createGroup', (cb, results) => {
      models.User.create(backer)
        .tap(u => results.createGroup.addUserWithRole(u, roles.BACKER))
        .then(u => cb(null, u))
        .catch(cb);
    }],

    createBacker2: ['createGroup', (cb, results) => {
      models.User.create(backer2)
        .tap(u => results.createGroup.addUserWithRole(u, roles.BACKER))
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

    createPaypalPaymentMethod: ['createTestUser', (cb, results) => {
      models.PaymentMethod.create({ service: 'paypal', UserId: results.createTestUser.id})
      .then(() => cb())
      .catch(cb);
    }],

    addDonation1: ['createBacker', (cb, results) => {
      models.Donation.create({
        title: "Donation 1",
        amount: 100,
        currency: 'EUR',
        GroupId: results.createGroup.id,
        UserId: results.createBacker.id
      })
      .then(donation => models.Transaction.create({
        amount: 1,
        currency: "EUR",
        UserId: results.createBacker.id,
        DonationId: donation.id
      }))
      .then(t => t.setGroup(results.createGroup))
      .then(() => cb())
      .catch(cb);
    }],

    addDonation2: ['createBacker2', 'addDonation1', (cb, results) => {
      models.Donation.create({
        title: "Donation 2",
        amount: 200,
        currency: 'EUR',
        GroupId: results.createGroup.id,
        UserId: results.createBacker2.id
      })
      .then(donation => models.Transaction.create({
        amount: 2,
        currency: "EUR",
        UserId: results.createBacker2.id,
        DonationId: donation.id
      }))
      .then(t => t.setGroup(results.createGroup))
      .then(() => cb())
      .catch(cb);
    }],

    addExpense1: ['createTestUser', (cb, results) => {
      models.Expense.create({
        "title": "Expense 2",
        "amount": 100,
        "currency": "EUR",
        "incurredAt": "2016-03-01T08:00:00.000Z",
        "createdAt": "2016-03-01T08:00:00.000Z",
        "GroupId": results.createGroup.id,
        "UserId": results.createTestUser.id,
        "lastEditedById": results.createTestUser.id,
        "payoutMethod": 'paypal'
      })
      .then(() => cb())
      .catch(cb);
    }],

    // We add a second expense that incurred before the first expense we created
    addExpense2: ['createMember', 'addExpense1', (cb, results) => {
      models.Expense.create({
        "title": "Expense 1",
        "amount": 200,
        "currency": "EUR",
        "incurredAt": "2016-02-29T08:00:00.000Z",
        "createdAt": "2016-03-01T08:00:00.000Z",
        "GroupId": results.createGroup.id,
        "UserId": results.createMember.id,
        "lastEditedById": results.createMember.id,
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
};

export const generateTestEmail = function(req, res) {
  const { template } = req.params;
  try {
    const data = JSON.parse(req.query.data);
    console.log(`Generating ${template} with data`, data);
    const html = emailLib.render(template, data);
    res.send(html);
  } catch (e) {
    res.send("Invalid data", e);
  }
};

