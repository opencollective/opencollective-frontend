/** @module test/graphql.expenses.test
 *
 * This tests all the IRS Bot iterations over expenses. */

/* Test libraries */
import sinon from 'sinon';
import { expect } from 'chai';

/* Test utilities */
import * as utils from './utils';
import * as store from './features/support/stores';

/* Support code */
import models from '../server/models';
import emailLib from '../server/lib/email';
import nock from 'nock';
import initNock from './irs.bot.nock';

/* Queries used throughout these tests */
const createExpenseQuery = `
  mutation createExpense($expense: ExpenseInputType!) {
    createExpense(expense: $expense) {
      id
      status
      user { id name collective { id name slug } } } }`;

describe('irs.bot.test.js', () => {
  before(initNock);
  
  beforeEach(utils.resetTestDB);

  beforeEach(utils.resetCaches);

  beforeEach(async () => {
    // Inserting OpenCollective Bot Collective based on the migration file
    // 20180725202700-populate-collective-with-opencollective-bot.js
    await models.Collective.create({
      name: 'IRS Bot',
      mission: 'Support users through the platform',
      description: 'IRS bot that support users regarding IRS issues through the platform',
      longDescription: 'IRS bot that support users regarding IRS issues  through the platform',
      currency: 'USD',
      image: 'https://cldup.com/rdmBCmH20l.png',
      isActive: true,
      slug: 'irs-bot',
      website: 'https://opencollective.com',
      type: 'BOT',
      settings: JSON.stringify({
        thresholdW9: 60000,
        thresholdW9HtmlComment: '<p>You have now been paid $600 or more through Open Collective, which' +
          ' means we need to ask you fill out a tax form. For more info,' +
          ' <a href="https://github.com/opencollective/opencollective/wiki/Submitting-Expenses#taxes">' +
          'click here see the help wiki.</a></p>'
      })
    });
  });

  after(() => {
    nock.cleanAll();
  });

  describe('#createCommentForExpenses', () => {

    let sandbox, emailSendMessageSpy;
    
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
    });

    afterEach(() => sandbox.restore());

    it('creates a new expense greater than 600 USD but DO NOT create Comment because host is not USD based', async () => {
      // Given a collective in USD with a host in EUR
      const { collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'EUR', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // When a new expense is created
      const data = {
        amount: 70000, currency: 'USD', payoutMethod: 'paypal',
        description: "Test expense for pizza",
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: "https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg",
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const result = await utils.graphqlQuery(createExpenseQuery, { expense: data }, user);
      result.errors && console.log(result.errors);

      // Then there should be no errors in the response
      expect(result.errors).to.not.exist;

      // And then the newly created expense should have the PENDING
      // status as its initial status
      expect(result.data.createExpense.status).to.equal('PENDING');
      // And then the expense's creator should be our user
      expect(result.data.createExpense.user.id).to.equal(user.id);

      // And then the user should become a member of the project
      const membership = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'CONTRIBUTOR' } });
      expect(membership).to.exist;
      expect(membership.MemberCollectiveId).to.equal(user.CollectiveId);

      // And then an email should have been sent to the admin. This
      // call to the function `waitForCondition()` is required because
      // notifications are sent asynchronously.
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
      expect(emailSendMessageSpy.callCount).to.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.equal("New expense on Test Collective: $700 for Test expense for pizza");
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain("/test-collective/expenses/1/approve");

    }); /* End of "creates a new expense greater than 600 USD but DO NOT create Comment because host is not USD based" */

    it('creates a new expense greater than 600 USD and create Comment expense forms email', async () => {
      // Given a collective in USD with a host in USD
      const { collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'USD', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // When a new expense is created
      const data = {
        amount: 70000, currency: 'USD', payoutMethod: 'paypal',
        description: "Test expense for pizza",
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: "https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg",
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const result = await utils.graphqlQuery(createExpenseQuery, { expense: data }, user);
      result.errors && console.log(result.errors);

      // Then there should be no errors in the response
      expect(result.errors).to.not.exist;

      // And then the newly created expense should have the PENDING
      // status as its initial status
      expect(result.data.createExpense.status).to.equal('PENDING');
      // And then the expense's creator should be our user
      expect(result.data.createExpense.user.id).to.equal(user.id);

      // And then the user should become a member of the project
      const membership = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'CONTRIBUTOR' } });
      expect(membership).to.exist;
      expect(membership.MemberCollectiveId).to.equal(user.CollectiveId);

      // And then an email should have been sent to the admin. This
      // call to the function `waitForCondition()` is required because
      // notifications are sent asynchronously.
      await utils.waitForCondition(() => emailSendMessageSpy.callCount == 2);

      expect(emailSendMessageSpy.callCount).to.equal(2);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.equal("New expense on Test Collective: $700 for Test expense for pizza");
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain("/test-collective/expenses/1/approve");
      expect(emailSendMessageSpy.secondCall.args[0]).to.equal(user.email);
      expect(emailSendMessageSpy.secondCall.args[1]).to.contain("New comment on your expense");

    }); /* End of "creates a new expense greater than 600 USD and create Comment expense forms email" */

    it('creates 2 new expenses that adds up more than 600 USD and create Comment expense forms email', async () => {
      // Given a collective in EUR with a host in USD
      const { collective } = await store.newCollectiveWithHost('Test Collective', 'EUR', 'USD', 10);

      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');

      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');

      // When the first expense is created
      const firstExpenseData = {
        amount: 30000, currency: 'EUR', payoutMethod: 'paypal',
        description: "Test expense for pizza",
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: "https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg",
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const firstExpense = await utils.graphqlQuery(createExpenseQuery, { expense: firstExpenseData }, user);
      firstExpense.errors && console.log(firstExpense.errors);
      expect(firstExpense.errors).to.not.exist;
      expect(firstExpense.data.createExpense.status).to.equal('PENDING');
      expect(firstExpense.data.createExpense.user.id).to.equal(user.id);

      // First expense triggers only one email(admin warning)
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
      expect(emailSendMessageSpy.callCount).to.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain("New expense on");
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain("/test-collective/expenses/1/approve");

      // When second expense is created
      const secondExpenseData = {
        amount: 90000, currency: 'EUR', payoutMethod: 'paypal',
        description: "Test expense for drink",
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: "https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg",
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const secondExpense = await utils.graphqlQuery(createExpenseQuery, { expense: secondExpenseData }, user);
      secondExpense.errors && console.log(secondExpense.errors);
      expect(secondExpense.errors).to.not.exist;
      expect(secondExpense.data.createExpense.status).to.equal('PENDING');
      expect(secondExpense.data.createExpense.user.id).to.equal(user.id);

      // Second expense triggers 2 emails(admin warning and new comment because it stepped over 600USD)
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 2);
      expect(emailSendMessageSpy.secondCall.args[0]).to.equal(admin.email);
      expect(emailSendMessageSpy.secondCall.args[1]).to.contain("New expense on");
      expect(emailSendMessageSpy.secondCall.args[2]).to.contain("/test-collective/expenses/2/approve");
      expect(emailSendMessageSpy.thirdCall.args[0]).to.equal(user.email);
      expect(emailSendMessageSpy.thirdCall.args[1]).to.contain("New comment on your expense");

    });/* End of "creates 2 new expenses that adds up more than 600 USD and create Comment expense forms email" */

  }); /* End of "#createCommentForExpenses" */
}); /* End of "irs.bot.test.js" */
