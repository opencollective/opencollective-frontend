import { expect } from 'chai';
import sinon from 'sinon';

import * as utils from '../../../utils';
import { fakeCollective, fakeConnectedAccount, fakeExpense, fakePayoutMethod } from '../../../test-helpers/fake-data';
import transferwise, { blackListedCurrencies } from '../../../../server/paymentProviders/transferwise';
import * as transferwiseLib from '../../../../server/lib/transferwise';
import { PayoutMethodTypes } from '../../../../server/models/PayoutMethod';

const sandbox = sinon.createSandbox();
const quote = {
  source: 'USD',
  target: 'EUR',
  sourceAmount: 101.14,
  targetAmount: 90.44,
  rate: 0.9044,
  fee: 1.14,
};
const createQuote = sandbox.stub(transferwiseLib, 'createQuote').resolves(quote);
sandbox.stub(transferwiseLib, 'getTemporaryQuote').resolves(quote);
sandbox.stub(transferwiseLib, 'getProfiles').resolves([
  {
    id: 217896,
    type: 'personal',
  },
  {
    id: 220192,
    type: 'business',
  },
]);
const createRecipientAccount = sandbox.stub(transferwiseLib, 'createRecipientAccount').resolves({
  id: 13804569,
  accountHolderName: 'Leo Kewitz',
  currency: 'EUR',
  country: 'DE',
  type: 'iban',
  details: {
    IBAN: 'DE89370400440532013000',
  },
});
const createTransfer = sandbox.stub(transferwiseLib, 'createTransfer').resolves({ id: 123 });
const fundTransfer = sandbox.stub(transferwiseLib, 'fundTransfer').resolves({ status: 'COMPLETED' });
sandbox.stub(transferwiseLib, 'getCurrencyPairs').resolves({
  sourceCurrencies: [
    {
      currencyCode: 'USD',
      targetCurrencies: [{ currencyCode: 'EUR' }, { currencyCode: 'GBP' }, { currencyCode: 'BRL' }],
    },
  ],
});

describe('paymentMethods.transferwise', () => {
  let connectedAccount, collective, host, payoutMethod, expense;

  after(sandbox.restore);
  before(utils.resetTestDB);
  before(async () => {
    host = await fakeCollective({ isHostAccount: true });
    connectedAccount = await fakeConnectedAccount({
      CollectiveId: host.id,
      service: 'transferwise',
      token: '33b5e94d-9815-4ebc-b970-3612b6aec332',
      data: { type: 'business', id: 0 },
    });
    collective = await fakeCollective({ isHostAccount: false, HostCollectiveId: host.id });
    payoutMethod = await fakePayoutMethod({
      type: PayoutMethodTypes.BANK_ACCOUNT,
      data: {
        accountHolderName: 'Leo Kewitz',
        currency: 'EUR',
        type: 'iban',
        legalType: 'PRIVATE',
        details: {
          IBAN: 'DE89370400440532013000',
        },
      },
    });
    expense = await fakeExpense({
      payoutMethod: 'transferwise',
      status: 'PENDING',
      amount: 10000,
      CollectiveId: collective.id,
      currency: 'USD',
      PayoutMethodId: payoutMethod.id,
      category: 'Engineering',
      type: 'INVOICE',
      description: 'January Invoice',
    });
  });

  describe('quoteExpense', () => {
    let quote;
    before(async () => {
      quote = await transferwise.quoteExpense(connectedAccount, payoutMethod, expense);
    });

    it('should assign profileId to connectedAccount', () => {
      expect(connectedAccount.toJSON()).to.have.nested.property('data.id', 220192);
    });

    it('should calculate targetAmount based on expense amount and rate', () => {
      expect(quote)
        .to.have.nested.property('targetAmount')
        .equals((expense.amount / 100) * quote.rate);
    });
  });

  describe('payExpense', () => {
    let data;
    before(async () => {
      expense = await fakeExpense({
        payoutMethod: 'transferwise',
        status: 'PENDING',
        amount: 10000,
        CollectiveId: host.id,
        currency: 'USD',
        FromCollectiveId: payoutMethod.id,
        category: 'Engineering',
        type: 'INVOICE',
        description: 'January Invoice',
      });
      data = await transferwise.payExpense(connectedAccount, payoutMethod, expense);
    });

    it('should return quote', () => {
      expect(createQuote.called).to.be.true;
      expect(data).to.have.nested.property('quote');
    });

    it('should create recipient account and update data.recipient', () => {
      expect(createRecipientAccount.called).to.be.true;
      expect(data).to.have.nested.property('recipient');
    });

    it('should create transfer account and update data.transfer', () => {
      expect(createTransfer.called).to.be.true;
      expect(data).to.have.nested.property('transfer');
    });

    it('should fund transfer account and update data.fund', () => {
      expect(fundTransfer.called).to.be.true;
      expect(data).to.have.nested.property('fund');
    });
  });

  describe('getAvailableCurrencies', () => {
    let data;
    before(async () => {
      data = await transferwise.getAvailableCurrencies(host);
    });

    it('should return an array of available currencies for host', async () => {
      expect(data).to.include('EUR');
    });

    it('should remove blackListed currencies', async () => {
      expect(data).to.not.have.members(blackListedCurrencies);
    });
  });
});
