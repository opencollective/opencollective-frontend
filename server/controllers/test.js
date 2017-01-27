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
    lastName: 'Damman',
    avatar: 'https://pbs.twimg.com/profile_images/3075727251/5c825534ad62223ae6a539f6a5076d3c.jpeg'
  }
  const backer = {
    email: 'backer@opencollective.com',
    firstName: 'Aseem',
    lastName: 'Sood',
    avatar: 'https://opencollective-production.s3-us-west-1.amazonaws.com/908fbcbca45e4a52a4309d00e980018c_e554f450-2127-11e6-9a76-e98f5a4a50b6.jpeg'
  }
  const backer2 = {
    email: 'backer2@opencollective.com',
    firstName: 'Pia',
    lastName: 'Mancini',
    avatar: 'https://opencollective-production.s3-us-west-1.amazonaws.com/9EflVQqM_400x400jpg_2aee92e0-858d-11e6-9fd7-73dd31eb7c0c.jpeg'
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
          {"name":"backer","range":[2,100000],"presets":[2,10,25],"interval":"monthly"},
          {"name":"sponsor","range":[100,500000],"presets":[100,250,500],"interval":"monthly"}
        ],
        currency: 'EUR',
        isActive: true
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
        amount: 100,
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
        amount: 200,
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

