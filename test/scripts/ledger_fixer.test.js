import sinon from 'sinon';
import { expect } from 'chai';
import { Migration } from '../../scripts/ledger_fixer';

describe('scripts/ledger_fixer', () => {
  // The changes performed by the migration code are stored within a
  // JSON key that contains the date the change happened. So to test
  // it properly here time has to be frozen.
  let clock;
  beforeEach(() => (clock = sinon.useFakeTimers(new Date('2018-03-20 0:0').getTime())));
  afterEach(() => clock.restore());

  describe('#saveTransactionChange', () => {
    it('should create a new change within the data field', () => {
      // Given a transaction with an empty data field
      const transaction = { data: null, changed: sinon.spy() };

      // When a new change is added
      new Migration().saveTransactionChange(transaction, 'hostCurrencyFxRate', null, 1);

      // Then the data field should reflect that update
      expect(transaction.data).to.have.property('migration');
      expect(transaction.data.migration).to.have.property('20180320');
      expect(transaction.data.migration['20180320']).to.have.property('hostCurrencyFxRate');
      expect(transaction.data.migration['20180320'].hostCurrencyFxRate).to.deep.equal({ oldValue: null, newValue: 1 });

      // And then the spy was properly called
      expect(transaction.changed.called).to.be.true;
    });

    it('should not override previously created fields', () => {
      // Given a transaction with a data field that contains a
      // migration field
      const transaction = {
        data: {
          migration: {
            '20180320': { hostCurrencyFxRate: { oldValue: null, newValue: 1 } },
          },
        },
        changed: sinon.spy(),
      };

      // When a new field is added
      new Migration().saveTransactionChange(transaction, 'platformFeeInHostCurrency', 1082, 1083);

      // Then both fields should be saved in the data.migration property
      expect(transaction.data).to.have.property('migration');
      expect(transaction.data.migration).to.have.property('20180320');
      expect(transaction.data.migration['20180320']).to.have.property('hostCurrencyFxRate');
      expect(transaction.data.migration['20180320'].hostCurrencyFxRate).to.deep.equal({ oldValue: null, newValue: 1 });
      expect(transaction.data.migration['20180320']).to.have.property('platformFeeInHostCurrency');
      expect(transaction.data.migration['20180320'].platformFeeInHostCurrency).to.deep.equal({
        oldValue: 1082,
        newValue: 1083,
      });
    });
  });
  describe('#ensureHostCurrencyFxRate', () => {
    it('should not touch transactions that contain a hostCurrencyFxRate value', () => {
      // Given a transaction *with a value* for hostCurrencyFxRate
      const transaction = { hostCurrencyFxRate: 1.5, changed: sinon.spy() };

      // When we call the function that ensures the value exists
      new Migration().ensureHostCurrencyFxRate(transaction);

      // Then nothing changes in the transaction.hostCurrencyFxRate
      // value
      expect(transaction.hostCurrencyFxRate).to.equal(1.5);
    });
    it('should not touch transactions between different currencies', () => {
      // Given a transaction between different currencies
      const transaction = {
        currency: 'MXN',
        hostCurrency: 'USD',
        hostCurrencyFxRate: 18.2,
        changed: sinon.spy(),
      };
      // when we call the function to that the value exists
      new Migration().ensureHostCurrencyFxRate(transaction);
      // Then we see that nothing is done to hostCurrencyFxRate
      expect(transaction.hostCurrencyFxRate).to.equal(18.2);
    });
    it('should not touch transactions that amount is different from amountInHostCurrency', () => {
      // Given a transaction with amount different from amountInHostCurrency
      const transaction = {
        amount: 10,
        amountInHostCurrency: 20,
        hostCurrencyFxRate: 2,
        changed: sinon.spy(),
      };
      // when we call the function to that the value exists
      new Migration().ensureHostCurrencyFxRate(transaction);
      // Then we see that nothing is done to hostCurrencyFxRate
      expect(transaction.hostCurrencyFxRate).to.equal(2);
    });
  });
  describe('#rewriteFees', () => {
    it('should find hostFeeInHostCurrency in the credit transaction & ensure it is negative in both credit & debit', () => {
      // Given a credit and a debit transactions
      const [credit1, debit1] = [
        { hostFeeInHostCurrency: 250, changed: sinon.spy() },
        { hostFeeInHostCurrency: 0, changed: sinon.spy() },
      ];
      const [credit2, debit2] = [
        { hostFeeInHostCurrency: null, changed: sinon.spy() },
        { hostFeeInHostCurrency: 250, changed: sinon.spy() },
      ];

      // When the fee is rewritten
      new Migration().rewriteFees(credit1, debit1);
      new Migration().rewriteFees(credit2, debit2);

      // Then we see that both hostFeeInHostCurrency values are
      // negative
      expect(credit1.hostFeeInHostCurrency).to.equal(-250);
      expect(debit1.hostFeeInHostCurrency).to.equal(-250);
      expect(credit1.data.migration['20180320']).to.deep.equal({
        hostFeeInHostCurrency: { oldValue: 250, newValue: -250 },
      });
      expect(debit1.data.migration['20180320']).to.deep.equal({
        hostFeeInHostCurrency: { oldValue: 0, newValue: -250 },
      });

      expect(credit2.hostFeeInHostCurrency).to.equal(-250);
      expect(debit2.hostFeeInHostCurrency).to.equal(-250);
      expect(credit2.data.migration['20180320']).to.deep.equal({
        hostFeeInHostCurrency: { oldValue: null, newValue: -250 },
      });
      expect(debit2.data.migration['20180320']).to.deep.equal({
        hostFeeInHostCurrency: { oldValue: 250, newValue: -250 },
      });
    });
    it('should find platformFeeInHostCurrency in the credit transaction & ensure it is negative in both credit & debit', () => {
      // Given a credit and a debit transactions
      const [credit1, debit1] = [
        { platformFeeInHostCurrency: 250, changed: sinon.spy() },
        { platformFeeInHostCurrency: 0, changed: sinon.spy() },
      ];
      const [credit2, debit2] = [
        { platformFeeInHostCurrency: null, changed: sinon.spy() },
        { platformFeeInHostCurrency: 250, changed: sinon.spy() },
      ];

      // When the fee is rewritten
      new Migration().rewriteFees(credit1, debit1);
      new Migration().rewriteFees(credit2, debit2);

      // Then we see that both platformFeeInHostCurrency values are
      // negative
      expect(credit1.platformFeeInHostCurrency).to.equal(-250);
      expect(debit1.platformFeeInHostCurrency).to.equal(-250);
      expect(credit1.data.migration['20180320']).to.deep.equal({
        platformFeeInHostCurrency: { oldValue: 250, newValue: -250 },
      });
      expect(debit1.data.migration['20180320']).to.deep.equal({
        platformFeeInHostCurrency: { oldValue: 0, newValue: -250 },
      });

      expect(credit2.platformFeeInHostCurrency).to.equal(-250);
      expect(debit2.platformFeeInHostCurrency).to.equal(-250);
      expect(credit2.data.migration['20180320']).to.deep.equal({
        platformFeeInHostCurrency: { oldValue: null, newValue: -250 },
      });
      expect(debit2.data.migration['20180320']).to.deep.equal({
        platformFeeInHostCurrency: { oldValue: 250, newValue: -250 },
      });
    });
    it('should find paymentProcessorFeeInHostCurrency in the credit transaction & ensure it is negative in both credit & debit', () => {
      // Given a credit and a debit transactions
      const [credit1, debit1] = [
        { paymentProcessorFeeInHostCurrency: 250, changed: sinon.spy() },
        { paymentProcessorFeeInHostCurrency: 0, changed: sinon.spy() },
      ];
      const [credit2, debit2] = [
        { paymentProcessorFeeInHostCurrency: null, changed: sinon.spy() },
        { paymentProcessorFeeInHostCurrency: 250, changed: sinon.spy() },
      ];

      // When the fee is rewritten
      new Migration().rewriteFees(credit1, debit1);
      new Migration().rewriteFees(credit2, debit2);

      // Then we see that both paymentProcessorFeeInHostCurrency
      // values are negative
      expect(credit1.paymentProcessorFeeInHostCurrency).to.equal(-250);
      expect(debit1.paymentProcessorFeeInHostCurrency).to.equal(-250);
      expect(credit1.data.migration['20180320']).to.deep.equal({
        paymentProcessorFeeInHostCurrency: { oldValue: 250, newValue: -250 },
      });
      expect(debit1.data.migration['20180320']).to.deep.equal({
        paymentProcessorFeeInHostCurrency: { oldValue: 0, newValue: -250 },
      });

      expect(credit2.paymentProcessorFeeInHostCurrency).to.equal(-250);
      expect(debit2.paymentProcessorFeeInHostCurrency).to.equal(-250);
      expect(credit2.data.migration['20180320']).to.deep.equal({
        paymentProcessorFeeInHostCurrency: { oldValue: null, newValue: -250 },
      });
      expect(debit2.data.migration['20180320']).to.deep.equal({
        paymentProcessorFeeInHostCurrency: { oldValue: 250, newValue: -250 },
      });
    });
  });
});
