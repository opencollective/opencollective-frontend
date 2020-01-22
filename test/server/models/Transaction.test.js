import { expect } from 'chai';
import sinon from 'sinon';
import * as utils from '../../utils';
import models from '../../../server/models';

const { Transaction } = models;

const userData = utils.data('user1');
const collectiveData = utils.data('collective1');
const transactionsData = utils.data('transactions1').transactions;

describe('server/models/Transaction', () => {
  let user, host, collective, defaultTransactionData;

  beforeEach(() => utils.resetTestDB());

  beforeEach('create user', () => models.User.createUserWithCollective(userData).tap(u => (user = u)));
  beforeEach('create host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => (host = u)));

  beforeEach('create collective2 and add host', () =>
    models.Collective.create(collectiveData)
      .tap(g => (collective = g))
      .tap(() => {
        defaultTransactionData = {
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          CollectiveId: collective.id,
          HostCollectiveId: host.CollectiveId,
        };
      })
      .then(() => collective.addHost(host.collective, host)),
  );

  it('automatically generates uuid', done => {
    Transaction.create({
      amount: -1000,
      ...defaultTransactionData,
    })
      .then(transaction => {
        expect(transaction.info.uuid).to.match(
          /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
        );
        done();
      })
      .catch(done);
  });

  it('get the host', done => {
    Transaction.create({
      ...defaultTransactionData,
      amount: 10000,
    }).then(transaction => {
      expect(transaction.HostCollectiveId).to.equal(host.CollectiveId);
      done();
    });
  });

  it('createFromPayload creates a double entry transaction for a Stripe payment in EUR with VAT', () => {
    const transaction = {
      description: '€121 for Vegan Burgers including €21 VAT',
      amount: 12100,
      amountInHostCurrency: 12100,
      currency: 'EUR',
      hostCurrency: 'EUR',
      hostCurrencyFxRate: 1,
      platformFeeInHostCurrency: 500,
      hostFeeInHostCurrency: 500,
      paymentProcessorFeeInHostCurrency: 300,
      taxAmount: 2100,
      type: 'CREDIT',
      createdAt: '2015-05-29T07:00:00.000Z',
      PaymentMethodId: 1,
    };

    return Transaction.createFromPayload({
      transaction,
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      CollectiveId: collective.id,
    }).then(() => {
      return Transaction.findAll().then(transactions => {
        expect(transactions.length).to.equal(2);
        expect(transactions[0].type).to.equal('DEBIT');
        expect(transactions[0].netAmountInCollectiveCurrency).to.equal(-12100);
        expect(transactions[0].currency).to.equal('EUR');
        expect(transactions[0].HostCollectiveId).to.be.null;

        expect(transactions[1].type).to.equal('CREDIT');
        expect(transactions[1].amount).to.equal(12100);
        expect(transactions[1].platformFeeInHostCurrency).to.equal(-500);
        expect(transactions[1].paymentProcessorFeeInHostCurrency).to.equal(-300);
        expect(transactions[1].taxAmount).to.equal(-2100);
        expect(transactions[1].amount).to.equal(12100);
        expect(transactions[1].netAmountInCollectiveCurrency).to.equal(8700);
        expect(transactions[0] instanceof models.Transaction).to.be.true;
        expect(transactions[0].description).to.equal(transaction.description);
      });
    });
  });

  it('createFromPayload creates a double entry transaction for a Stripe donation in EUR on a USD host', () => {
    const transaction = {
      description: '€100 donation to WWCode Berlin',
      amount: 10000,
      amountInHostCurrency: 11000,
      currency: 'EUR',
      hostCurrency: 'USD',
      hostCurrencyFxRate: 1.1,
      platformFeeInHostCurrency: 550,
      hostFeeInHostCurrency: 550,
      paymentProcessorFeeInHostCurrency: 330,
      type: 'CREDIT',
      createdAt: '2015-05-29T07:00:00.000Z',
      PaymentMethodId: 1,
    };

    return Transaction.createFromPayload({
      transaction,
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      CollectiveId: collective.id,
    }).then(() => {
      return Transaction.findAll().then(transactions => {
        expect(transactions.length).to.equal(2);
        expect(transactions[0].type).to.equal('DEBIT');
        expect(transactions[0].netAmountInCollectiveCurrency).to.equal(-10000);
        expect(transactions[0].currency).to.equal('EUR');
        expect(transactions[0].HostCollectiveId).to.be.null;

        expect(transactions[1].type).to.equal('CREDIT');
        expect(transactions[1].amount).to.equal(10000);
        expect(transactions[1].platformFeeInHostCurrency).to.equal(-550);
        expect(transactions[1].paymentProcessorFeeInHostCurrency).to.equal(-330);
        expect(transactions[1].taxAmount).to.be.null;
        expect(transactions[1].amount).to.equal(10000);
        expect(transactions[1].netAmountInCollectiveCurrency).to.equal(8700);
        expect(transactions[0] instanceof models.Transaction).to.be.true;
        expect(transactions[0].description).to.equal(transaction.description);
      });
    });
  });

  it('createFromPayload() generates a new activity', done => {
    const createActivityStub = sinon.stub(Transaction, 'createActivity').callsFake(t => {
      expect(Math.abs(t.amount)).to.equal(Math.abs(transactionsData[7].netAmountInCollectiveCurrency));
      createActivityStub.restore();
      done();
    });

    Transaction.createFromPayload({
      transaction: transactionsData[7],
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      CollectiveId: collective.id,
    })
      .then(transaction => {
        expect(transaction.CollectiveId).to.equal(collective.id);
      })
      .catch(done);
  });
});
