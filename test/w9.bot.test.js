/** @module test/graphql.expenses.test
 *
 * This tests all the W9 Bot iterations over expenses. */

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
import initNock from './w9.bot.nock';

/* Queries used throughout these tests */
const createExpenseQuery = `
  mutation createExpense($expense: ExpenseInputType!) {
    createExpense(expense: $expense) {
      id
      status
      user { id name collective { id name slug } } } }`;

// W9 Bot Collective based on the migration file
// 20180725202700-createW9BotCollective.js
const botCollectiveData = {
  name: "W9 bot",
  slug: "w9bot",
  mission: "Help hosts by automating requesting users to submit their W9 or W8-BEN form when needed",
  description: "Help hosts by automating requesting users to submit their W9 or W8-BEN form when needed",
  longDescription: "Whenever someone files an expense to a host that has USD as its base currency, this bot will look at the sum of all past expenses of that user made during the year. If the sum exceeds $600, it will create a comment on the expense to ask to submit the W9, W8-BEN or W8-BEN-e form to the host",
  currency: 'USD',
  image: 'https://cldup.com/rdmBCmH20l.png',
  isActive: true,
  website: 'https://opencollective.com',
  type: 'BOT',
  settings: {
    W9: {
      threshold: 60000,
      comment: '<p>The total amount of the expenses that you have submitted ' +
      'this year to this host exceeds $600. To comply with the IRS, we need you to send us the'+
      ' <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf">W9 form</a> if you are a ' +
      'US resident (if you are not a US resident, please send the '+
      '<a href="https://www.irs.gov/pub/irs-pdf/fw8ben.pdf">W-8BEN form</a> ' +
      'for individuals or the <a href="https://www.irs.gov/pub/irs-pdf/fw8bene.pdf">W-8BEN-E ' +
      'form</a> for companies) before we can proceed with this payment. ' +
      '<a href="https://github.com/opencollective/opencollective/wiki/Submitting-Expenses#taxes">' +
      'More info on our wiki</a>.</p>'
    }
  }
};

describe('w9.bot.test.js', () => {
  before(initNock);

  beforeEach(utils.resetTestDB);

  beforeEach(utils.resetCaches);

  beforeEach(async () => {
    // Inserting W9 Bot collective
    await models.Collective.create(botCollectiveData);
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
      result.errors && console.error(result.errors);

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

    it('creates a new expense greater than 600 USD but DO NOT create Comment because host has already received the user\'s W9', async () => {
      // Given a collective in USD with a host in EUR
      const { collective, hostCollective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'EUR', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      hostCollective.update({ data: { W9: { receivedFromUserIds: [ user.id ] } } });
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
      result.errors && console.error(result.errors);

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
      const { hostCollective, collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'USD', 10);
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
      result.errors && console.error(result.errors);

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

      // And then find Updated Host Collection to check if it includes the userId in its data.w9UserIds field
      const updatedHostCollective = await models.Collective.findById(hostCollective.id);
      expect(updatedHostCollective).to.exist;
      expect(updatedHostCollective.data).to.exist;
      expect(updatedHostCollective.data.W9.requestSentToUserIds).to.exist;
      expect(updatedHostCollective.data.W9.requestSentToUserIds.length).to.equal(1);
      expect(updatedHostCollective.data.W9.requestSentToUserIds[0]).to.equal(user.id);
    }); /* End of "creates a new expense greater than 600 USD and create Comment expense forms email" */

    it('creates 2 new expenses that adds up more than 600 USD(each) and DO NOT create a new Bot Comment after the first one', async () => {
      // Given a collective in USD with a host in USD
      const { hostCollective, collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'USD', 10);

      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');

      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');

      // When the first expense is created
      const firstExpenseData = {
        amount: 70000, currency: 'USD', payoutMethod: 'paypal',
        description: "Test expense for pizza",
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: "https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg",
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const firstExpense = await utils.graphqlQuery(createExpenseQuery, { expense: firstExpenseData }, user);
      firstExpense.errors && console.error(firstExpense.errors);
      expect(firstExpense.errors).to.not.exist;
      expect(firstExpense.data.createExpense.status).to.equal('PENDING');
      expect(firstExpense.data.createExpense.user.id).to.equal(user.id);

      // First expense triggers 2 emails(admin warning email and new comment email)
      await utils.waitForCondition(() => emailSendMessageSpy.callCount == 2);

      expect(emailSendMessageSpy.callCount).to.equal(2);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain("New expense on");
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain("/test-collective/expenses/1/approve");
      expect(emailSendMessageSpy.secondCall.args[0]).to.equal(user.email);
      expect(emailSendMessageSpy.secondCall.args[1]).to.contain("New comment on your expense");

      // And then find Updated Host Collection to check if it includes the userId in its data.W9.requestSentToUserIds field
      const updatedHostCollective = await models.Collective.findById(hostCollective.id);
      expect(updatedHostCollective).to.exist;
      expect(updatedHostCollective.data).to.exist;
      expect(updatedHostCollective.data.W9.requestSentToUserIds).to.exist;
      expect(updatedHostCollective.data.W9.requestSentToUserIds.length).to.equal(1);
      expect(updatedHostCollective.data.W9.requestSentToUserIds[0]).to.equal(user.id);

      const numberOfComments = await models.Comment.count();
      // When second expense is created
      const secondExpenseData = {
        amount: 70000, currency: 'USD', payoutMethod: 'paypal',
        description: "Test expense for drink",
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: "https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg",
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const secondExpense = await utils.graphqlQuery(createExpenseQuery, { expense: secondExpenseData }, user);
      secondExpense.errors && console.error(secondExpense.errors);
      expect(secondExpense.errors).to.not.exist;
      expect(secondExpense.data.createExpense.status).to.equal('PENDING');
      expect(secondExpense.data.createExpense.user.id).to.equal(user.id);

      // Second expense Does Not Generate Any new Comment
      const numberOfCommentsAfterAddExpense = await models.Comment.count();
      expect(numberOfComments).to.equal(numberOfCommentsAfterAddExpense);
    });/* End of "creates 2 new expenses that adds up more than 600 USD(each) and DO NOT create a new Bot Comment after the first one" */

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
      firstExpense.errors && console.error(firstExpense.errors);
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
      secondExpense.errors && console.error(secondExpense.errors);
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
}); /* End of "w9.bot.test.js" */
