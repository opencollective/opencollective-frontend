const _ = require('lodash');
const async = require('async');
const config = require('config');
const expect = require('chai').expect;

const script = require('../scripts/populate_recurring_paypal_transactions');
const app = require('../index');
const models = app.set('models');
const utils = require('../test/utils.js')();
const data = utils.data;
const roles = require('../app/constants/roles');
const createTransaction = require('../app/controllers/transactions')(app)._create;

const paypalTransaction = {
  created: {
    transaction_id: 'I-HDA11N62294M',
    status: 'Created',
    transaction_type: 'Recurring Payment',
    payer_email: '',
    payer_name: 'Xavier Damman',
    time_stamp: '2016-03-18T09:26:38Z',
    time_zone: 'GMT'
  },
  completed: {
    transaction_id: '1JU73306EH9078253',
    status: 'Completed',
    transaction_type: 'Recurring Payment',
    amount: { currency: 'USD', value: '5.00' },
    fee_amount: { currency: 'USD', value: '-0.50' },
    net_amount: { currency: 'USD', value: '4.50' },
    payer_email: 'arnaudbenard13+paypalsandbox@gmail.com',
    payer_name: 'Xavier Damman',
    time_stamp: '2016-03-19T04:01:36Z',
    time_zone: 'GMT'
  }
};

describe('scripts/populate_recurring_paypal_transactions', () => {
  const billingAgreementId = 'billingAgreementId-abc';

  var application;
  var user;
  var group;
  var transaction;
  var subscription;
  var runScript;

  beforeEach((done) => utils.cleanAllDb(done));

  beforeEach((done) => {
    models.User.create(data('user1')).done((e, u) => {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  beforeEach((done) => {
    models.Group.create(data('group1')).done((e, g) => {
      expect(e).to.not.exist;
      group = g;
      done();
    });
  });

  beforeEach((done) => {
    group
      .addUserWithRole(user, roles.HOST)
      .done(done);
  });

  beforeEach((done) => {
    models.ConnectedAccount.create({
      provider: 'paypal',
      clientId: 'abc',
      secret: 'def'
    })
    .then((account) => account.setUser(user))
    .then(() => done())
    .catch(done);
  });

  beforeEach((done) => {
    const fixture = {
      amount: 10,
      currency: 'USD',
      interval: 'month'
    };

    createTransaction({
      group,
      user,
      transaction: fixture,
      subscription: _.extend({}, fixture, {
        data: {
          billingAgreementId
        }
      })
    }, (e, res) => {
      expect(e).to.not.exist;

      models.Transaction.findOne({
        where: { id: res.id },
        include: [
          { model: models.Group },
          { model: models.User }
        ]
      })
      .done((e, t) => {
        expect(e).to.not.exist;
        transaction = t;
        done();
      });
    });
  });

  beforeEach((done) => {
    script.findSubscriptions()
    .then((res) => {
      subscription = res[0];
      done();
    })
    .catch(done);
  });

  beforeEach(() => {
    runScript = (paypalTransactions) => {
      return script.findSubscriptions()
      .get(0)
      .then((subscription) => {
        return script.handlePaypalTransactions(
          paypalTransactions,
          transaction,
          subscription,
          billingAgreementId
        );
      });
    }
  });

  it('updates if it has 1 completed event', done => {
    runScript([
      paypalTransaction.created,
      paypalTransaction.completed
    ])
    .then(res => {
      expect(res.subscription.isActive).to.be.true;
      expect(res.subscription.activatedAt).to.be.ok;
      expect(res.transaction.data).to.be.equal(paypalTransaction.completed);
      expect(res.transaction.id).to.be.equal(transaction.id);

      return models.Transaction.count();
    })
    .then(count => expect(count).to.be.equal(1))
    .then(() => done())
    .catch(done);
  });

  it('creates a new transaction for an active subscription', (done) => {
    const transaction_id = 'transaction_id-abc';

    // First confirmation
    script.handlePaypalTransactions([
        paypalTransaction.created,
        paypalTransaction.completed
      ],
      transaction,
      subscription,
      billingAgreementId
    )
    .then(() => models.Transaction.count())
    .tap((count) => expect(count).to.be.equal(1))
    .then(() => script.findSubscriptions()) // get latest data after first run
    .then((subscriptions) => {
      // second time - i.e. recurring after a month
      return script.handlePaypalTransactions([
          paypalTransaction.created,
          paypalTransaction.completed,
          _.extend({}, paypalTransaction.completed, { transaction_id })
        ],
        transaction,
        subscriptions[0],
        billingAgreementId
      );
    })
    .then(() => models.Transaction.findAndCountAll())
    .then(res => {
      expect(res.count).to.be.equal(2); // only adds one
      expect(res.rows[0].data.transaction_id).to.be.equal(paypalTransaction.completed.transaction_id);
      expect(res.rows[1].data.transaction_id).to.be.equal(transaction_id); // new one
      expect(res.rows[1]).to.have.property('UserId');
      expect(res.rows[1]).to.have.property('GroupId');
      expect(res.rows[1]).to.have.property('SubscriptionId');
    })
    .then(() => done())
    .catch(done);
  });

  it('does not create a new transaction if it is already created', (done) => {
    const paypalTransactions = [
      paypalTransaction.created,
      paypalTransaction.completed
    ];

    runScript(paypalTransactions)
      .then(() => runScript(paypalTransactions))
      .then(() => models.Transaction.count())
      .then((count) => expect(count).to.be.equal(1))
      .then(() => done())
      .catch(done);
  });


  it('ignores if it does not have a created event', (done) => {
    runScript([])
      .then(message => {
        expect(message).to.be.equal(`No Created event, invalid: ${billingAgreementId}`);
        done();
      })
      .catch(done);
  });

  it('fails if it does not have a completed event', (done) => {
    runScript([paypalTransaction.created])
      .then(message => {
        expect(message).to.be.equal(`Billing agreement (${billingAgreementId}) not processed yet, no completed event`);
        done();
      })
      .catch(done);
  });

  it('fails if it has more than 1 completed event', (done) => {
    runScript([
      paypalTransaction.created,
      paypalTransaction.completed,
      paypalTransaction.completed
    ])
    .then(message => {
      expect(message).to.be.equal(`Invalid subscription ${subscription.id} with billingAgreement ${billingAgreementId}, it should be activated already`);
      done();
    })
    .catch(done);
  });

});
