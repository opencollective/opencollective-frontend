import { v4 as uuid } from 'uuid';
import { expect } from 'chai';

import models from '../../../../server/models';
import prepaid from '../../../../server/paymentProviders/opencollective/prepaid';

import { randEmail } from '../../../stores';

describe('server/paymentProviders/opencollective/prepaid', () => {
  const PREPAID_INITIAL_BALANCE = 5000;
  const CURRENCY = 'USD';
  let user = null;
  let hostCollective = null;
  let targetCollective = null;
  let prepaidPm = null;
  let hostAdmin = null;

  before(async () => {
    hostAdmin = await models.User.createUserWithCollective({ name: '___', email: randEmail() });
    hostCollective = await models.Collective.create({
      type: 'ORGANIZATION',
      name: 'Test HOST',
      currency: CURRENCY,
      isActive: true,
      CreatedByUserId: hostAdmin.id,
    });
  });

  before(async () => {
    user = await models.User.createUserWithCollective({
      name: 'Test Prepaid Donator',
      email: randEmail('prepaid-donator@opencollective.com'),
    });
  });

  before(async () => {
    targetCollective = await models.Collective.create({
      name: 'Test Collective',
      currency: CURRENCY,
      isActive: true,
    }).then(c => (targetCollective = c));
    await targetCollective.addHost(hostCollective, user, { shouldAutomaticallyApprove: true });
  });

  before(async () => {
    prepaidPm = await models.PaymentMethod.create({
      name: 'Host funds',
      initialBalance: PREPAID_INITIAL_BALANCE,
      monthlyLimitPerMember: null,
      currency: CURRENCY,
      CollectiveId: user.collective.id,
      customerId: user.id,
      uuid: uuid(),
      data: { HostCollectiveId: hostCollective.id },
      service: 'opencollective',
      type: 'prepaid',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('get initial balance', async () => {
    const balance = await prepaid.getBalance(prepaidPm);
    expect(balance.amount).to.be.equal(PREPAID_INITIAL_BALANCE);
    expect(balance.currency).to.be.equal(CURRENCY);
  });

  it('create order', async () => {
    const orderData = {
      createdByUser: user,
      fromCollective: user.collective,
      FromCollectiveId: user.collective.id,
      collective: targetCollective,
      CollectiveId: targetCollective.id,
      paymentMethod: prepaidPm,
      totalAmount: 1000,
      currency: 'USD',
    };

    const transactions = await prepaid.processOrder(orderData);
    expect(transactions).to.exist;

    // Check balance decreased
    const balance = await prepaid.getBalance(prepaidPm);
    expect(balance.amount).to.be.equal(PREPAID_INITIAL_BALANCE - 1000);
  });

  it("can't spend more than balance", async () => {
    const balance = await prepaid.getBalance(prepaidPm);
    const orderData = {
      createdByUser: user,
      fromCollective: user.collective,
      FromCollectiveId: user.collective.id,
      collective: targetCollective,
      CollectiveId: targetCollective.id,
      paymentMethod: prepaidPm,
      totalAmount: balance.amount + 1,
      currency: 'USD',
    };

    return expect(prepaid.processOrder(orderData)).to.be.rejectedWith(
      Error,
      "This payment method doesn't have enough funds to complete this order",
    );
  });

  it('refund', async () => {
    const initialBalance = await prepaid.getBalance(prepaidPm);
    const orderData = {
      createdByUser: user,
      fromCollective: user.collective,
      FromCollectiveId: user.collective.id,
      collective: targetCollective,
      CollectiveId: targetCollective.id,
      paymentMethod: prepaidPm,
      totalAmount: 1000,
      currency: 'USD',
    };

    const transaction = await prepaid.processOrder(orderData);
    expect(transaction).to.exist;

    // Check balance decreased
    const balanceAfterOrder = await prepaid.getBalance(prepaidPm);
    expect(balanceAfterOrder.amount).to.be.equal(initialBalance.amount - 1000);

    // Make refund
    await prepaid.refundTransaction(transaction, user);
    const balanceAfterRefund = await prepaid.getBalance(prepaidPm);
    expect(balanceAfterRefund.amount).to.be.equal(initialBalance.amount);
  });
});
