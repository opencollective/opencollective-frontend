import { expect } from 'chai';
import sinon from 'sinon';

import {
  fakeCollective,
  fakeConnectedAccount,
  fakeExpense,
  fakePayoutMethod,
  fakeTransaction,
} from '../../test-helpers/fake-data';
import * as utils from '../../utils';
import { run as checkPendingTransfers } from '../../../cron/hourly/check-pending-transferwise-transactions.js';
import * as transferwiseLib from '../../../server/lib/transferwise';
import status from '../../../server/constants/expense_status';
import { PayoutMethodTypes } from '../../../server/models/PayoutMethod';

const getTransfer = sinon.stub(transferwiseLib, 'getTransfer');

describe('cron/hourly/check-pending-transferwise-transactions.js', () => {
  let expense;

  after(sinon.restore);
  beforeEach(utils.resetTestDB);
  beforeEach(async () => {
    const host = await fakeCollective({ isHostAccount: true });
    await fakeConnectedAccount({
      CollectiveId: host.id,
      service: 'transferwise',
      token: '33b5e94d-9815-4ebc-b970-3612b6aec332',
      data: { type: 'business', id: 0 },
    });
    const collective = await fakeCollective({ HostCollectiveId: host.id });
    const payoutMethod = await fakePayoutMethod({
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
      status: status.PROCESSING,
      amount: 10000,
      CollectiveId: collective.id,
      currency: 'USD',
      PayoutMethodId: payoutMethod.id,
      category: 'Engineering',
      type: 'INVOICE',
      description: 'January Invoice',
    });
    await fakeTransaction({
      type: 'DEBIT',
      amount: -1 * expense.amount,
      ExpenseId: expense.id,
      data: {
        transfer: { id: 1234 },
        quote: { fee: 1, rate: 1 },
        fees: { hostFeeInHostCurrency: 1, platformFeeInHostCurrency: 1 },
      },
    });
  });

  it('should complete processing transactions if transfer was sent', async () => {
    getTransfer.resolves({ status: 'outgoing_payment_sent' });
    await checkPendingTransfers();

    await expense.reload();

    expect(expense).to.have.property('status', status.PAID);
  });

  it('should set expense as rejected if transfer bounced back and the host was already refunded', async () => {
    getTransfer.resolves({ status: 'funds_refunded' });
    await checkPendingTransfers();

    await expense.reload();

    expect(expense).to.have.property('status', status.ERROR);
  });
});
