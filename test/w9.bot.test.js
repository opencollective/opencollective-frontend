/** @module test/graphql.expenses.test
 *
 * This tests all the W9 Bot iterations over expenses. */

/* Test libraries */
import sinon from 'sinon';
import { expect } from 'chai';
import { get } from 'lodash';

/* Test utilities */
import * as utils from './utils';
import * as store from './features/support/stores';

/* Support code */
import models from '../server/models';
import emailLib from '../server/lib/email';
import nock from 'nock';
import initNock from './w9.bot.nock';
import { W9_BOT_SLUG } from '../server/constants/collectives';

/* Queries used throughout these tests */
const createExpenseQuery = `
  mutation createExpense($expense: ExpenseInputType!) {
    createExpense(expense: $expense) {
      id
      status
      user { id name collective { id name slug } } } }`;

const approveExpenseQuery = `
  mutation approveExpense($id: Int!) {
    approveExpense(id: $id) { id status } }`;

const payExpenseQuery = `
mutation payExpense($id: Int!, $fee: Int!) {
  payExpense(id: $id, fee: $fee) { id status } }`;


// W9 Bot Collective based on the migration file
// 20180725202700-createW9BotCollective.js
const botCollectiveData = {
  name: 'W9 bot',
  slug: 'w9bot',
  mission: 'Help hosts by automating requesting users to submit their W9 or W8-BEN form when needed',
  description: 'Help hosts by automating requesting users to submit their W9 or W8-BEN form when needed',
  longDescription: 'Whenever someone files an expense to a host that has USD as its base currency, this bot will look at the sum of all past expenses of that user made during the year. If the sum exceeds $600, it will create a comment on the expense to ask to submit the W9, W8-BEN or W8-BEN-e form to the host',
  currency: 'USD',
  image: 'https://cldup.com/rdmBCmH20l.png',
  isActive: true,
  website: 'https://opencollective.com',
  type: 'BOT',
  settings: {
    W9: {
      threshold: 60000,
      comment: '<p>The total amount of the expenses that you have submitted ' +
      'this year to this host exceeds $600. To comply with the IRS, we need you to <a href="mailto:w9@opencollective.com?subject=W9%20for%20{{collective}}%20(hosted%20by%20{{host}})&body=Please%20find%20attached%20the%20[W9|W8-BEN|W8-BEN-E]%20form.%0D%0A%0D%0A-%20{{fromName}}%0D%0A%0D%0A---%0D%0A{{expenseUrl}}%0D%0ATotal%20amount%20expensed%20this%20year%20so%20far:%20{{totalAmountThisYear}}%0D%0A%0D%0A">send us by email</a> the'+
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

    it('creates a new expense greater than W9 Bot threshold but DO NOT create Comment because host is not USD based', async () => {
      // Given a collective in USD with a host in EUR
      const { collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'EUR', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the W9 Bot THRESHOLD
      const w9Bot = await models.Collective.findOne({
        where: {
          slug: W9_BOT_SLUG
        }
      });
      const threshold = get(w9Bot, 'settings.W9.threshold');
      expect(threshold).to.be.above(0);
      // When a new expense is created
      const data = {
        amount: threshold + 100, currency: 'USD', payoutMethod: 'paypal',
        description: 'Test expense for pizza',
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: 'https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg',
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const result = await utils.graphqlQuery(createExpenseQuery, { expense: data }, user);
      result.errors && console.error(result.errors);

      // Then there should be no errors in the response
      expect(result.errors).to.not.exist;

      // And then the newly created expense should have the PENDING
      // status as its initial status
      expect(result.data.createExpense.status).to.be.equal('PENDING');
      // And then the expense's creator should be our user
      expect(result.data.createExpense.user.id).to.be.equal(user.id);

      // And then the user should become a member of the project
      const membership = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'CONTRIBUTOR' } });
      expect(membership).to.exist;
      expect(membership.MemberCollectiveId).to.be.equal(user.CollectiveId);

      // And then an email should have been sent to the admin. This
      // call to the function `waitForCondition()` is required because
      // notifications are sent asynchronously.
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
      expect(emailSendMessageSpy.callCount).to.be.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.be.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.be.equal(`New expense on Test Collective: $${(threshold + 100)/100} for Test expense for pizza`);
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain('/test-collective/expenses/1/approve');

    }); /* End of "creates a new expense greater than W9 Bot threshold but DO NOT create Comment because host is not USD based" */

    it('creates a new expense greater than W9 Bot threshold but DO NOT create Comment because host has already received the user\'s W9', async () => {
      // Given a collective in USD with a host in EUR
      const { collective, hostCollective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'EUR', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      hostCollective.update({ data: { W9: { receivedFromUserIds: [ user.id ] } } });

      // And given the W9 Bot THRESHOLD
      const w9Bot = await models.Collective.findOne({
        where: {
          slug: W9_BOT_SLUG
        }
      });
      const threshold = get(w9Bot, 'settings.W9.threshold');
      expect(threshold).to.be.above(0);
      // When a new expense is created
      const data = {
        amount: threshold + 100, currency: 'USD', payoutMethod: 'paypal',
        description: 'Test expense for pizza',
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: 'https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg',
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const result = await utils.graphqlQuery(createExpenseQuery, { expense: data }, user);
      result.errors && console.error(result.errors);

      // Then there should be no errors in the response
      expect(result.errors).to.not.exist;

      // And then the newly created expense should have the PENDING
      // status as its initial status
      expect(result.data.createExpense.status).to.be.equal('PENDING');
      // And then the expense's creator should be our user
      expect(result.data.createExpense.user.id).to.be.equal(user.id);

      // And then the user should become a member of the project
      const membership = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'CONTRIBUTOR' } });
      expect(membership).to.exist;
      expect(membership.MemberCollectiveId).to.be.equal(user.CollectiveId);

      // And then an email should have been sent to the admin. This
      // call to the function `waitForCondition()` is required because
      // notifications are sent asynchronously.
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
      expect(emailSendMessageSpy.callCount).to.be.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.be.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.be.equal(`New expense on Test Collective: $${(threshold + 100)/100} for Test expense for pizza`);
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain('/test-collective/expenses/1/approve');

    }); /* End of "creates a new expense greater than W9 Bot threshold but DO NOT create Comment because host is not USD based" */

    it('creates a new expense greater than W9 Bot threshold and create Comment expense forms email', async () => {
      // Given a collective in USD with a host in USD
      const { hostCollective, collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'USD', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the W9 Bot THRESHOLD
      const w9Bot = await models.Collective.findOne({
        where: {
          slug: W9_BOT_SLUG
        }
      });
      const threshold = get(w9Bot, 'settings.W9.threshold');
      expect(threshold).to.be.above(0);
      // When a new expense is created
      const data = {
        amount: threshold + 100, currency: 'USD', payoutMethod: 'paypal',
        description: 'Test expense for pizza',
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: 'https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg',
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const result = await utils.graphqlQuery(createExpenseQuery, { expense: data }, user);
      result.errors && console.error(result.errors);

      // Then there should be no errors in the response
      expect(result.errors).to.not.exist;

      // And then the newly created expense should have the PENDING
      // status as its initial status
      expect(result.data.createExpense.status).to.be.equal('PENDING');
      // And then the expense's creator should be our user
      expect(result.data.createExpense.user.id).to.be.equal(user.id);

      // And then the user should become a member of the project
      const membership = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'CONTRIBUTOR' } });
      expect(membership).to.exist;
      expect(membership.MemberCollectiveId).to.be.equal(user.CollectiveId);

      // And then an email should have been sent to the admin. This
      // call to the function `waitForCondition()` is required because
      // notifications are sent asynchronously.
      await utils.waitForCondition(() => emailSendMessageSpy.callCount == 2);

      expect(emailSendMessageSpy.callCount).to.be.equal(2);
      expect(emailSendMessageSpy.firstCall.args[0]).to.be.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.be.equal(`New expense on Test Collective: $${(threshold + 100)/100} for Test expense for pizza`);
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain('/test-collective/expenses/1/approve');
      expect(emailSendMessageSpy.secondCall.args[0]).to.be.equal(user.email);
      expect(emailSendMessageSpy.secondCall.args[1]).to.contain('New comment on your expense');

      // Checks that the compile html worked with a proper mailto containing the name of the collective/host and permalink to expense
      expect(emailSendMessageSpy.secondCall.args[2]).to.contain('mailto:w9@opencollective.com?subject=W9%20for%20Test Collective%20(hosted%20by%20Test Collective)&body=Please%20find%20attached%20the%20[W9|W8-BEN|W8-BEN-E]%20form.%0D%0A%0D%0A-%20someone cool%0D%0A%0D%0A---%0D%0A');
      expect(emailSendMessageSpy.secondCall.args[2]).to.contain(`/test-collective/expenses/1%0D%0ATotal%20amount%20expensed%20this%20year%20so%20far:%20$${(threshold + 100)/100}%0D%0A%0D%0A`);

      // And then find Updated Host Collection to check if it includes the userId in its data.w9UserIds field
      const updatedHostCollective = await models.Collective.findById(hostCollective.id);
      expect(updatedHostCollective).to.exist;
      expect(updatedHostCollective.data).to.exist;
      expect(updatedHostCollective.data.W9.requestSentToUserIds).to.exist;
      expect(updatedHostCollective.data.W9.requestSentToUserIds.length).to.be.equal(1);
      expect(updatedHostCollective.data.W9.requestSentToUserIds[0]).to.be.equal(user.id);
    }); /* End of "creates a new expense greater than W9 Bot threshold and create Comment expense forms email" */

    it('creates 2 new expenses that adds up more than W9 Bot threshold(each) and DO NOT create a new Bot Comment after the first one', async () => {
      // Given a collective in USD with a host in USD
      const { hostCollective, collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'USD', 10);

      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');

      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');

      // And given the W9 Bot THRESHOLD
      const w9Bot = await models.Collective.findOne({
        where: {
          slug: W9_BOT_SLUG
        }
      });
      const threshold = get(w9Bot, 'settings.W9.threshold');
      expect(threshold).to.be.above(0);

      // When the first expense is created
      const firstExpenseData = {
        amount: threshold + 100, currency: 'USD', payoutMethod: 'paypal',
        description: 'Test expense for pizza',
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: 'https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg',
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const firstExpense = await utils.graphqlQuery(createExpenseQuery, { expense: firstExpenseData }, user);
      firstExpense.errors && console.error(firstExpense.errors);
      expect(firstExpense.errors).to.not.exist;
      expect(firstExpense.data.createExpense.status).to.be.equal('PENDING');
      expect(firstExpense.data.createExpense.user.id).to.be.equal(user.id);

      // First expense triggers 2 emails(admin warning email and new comment email)
      await utils.waitForCondition(() => emailSendMessageSpy.callCount == 2);

      expect(emailSendMessageSpy.callCount).to.be.equal(2);
      expect(emailSendMessageSpy.firstCall.args[0]).to.be.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain('New expense on');
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain('/test-collective/expenses/1/approve');
      expect(emailSendMessageSpy.secondCall.args[0]).to.be.equal(user.email);
      expect(emailSendMessageSpy.secondCall.args[1]).to.contain('New comment on your expense');

      // And then find Updated Host Collection to check if it includes the userId in its data.W9.requestSentToUserIds field
      const updatedHostCollective = await models.Collective.findById(hostCollective.id);
      expect(updatedHostCollective).to.exist;
      expect(updatedHostCollective.data).to.exist;
      expect(updatedHostCollective.data.W9.requestSentToUserIds).to.exist;
      expect(updatedHostCollective.data.W9.requestSentToUserIds.length).to.be.equal(1);
      expect(updatedHostCollective.data.W9.requestSentToUserIds[0]).to.be.equal(user.id);

      const numberOfComments = await models.Comment.count();
      // When second expense is created
      const secondExpenseData = {
        amount: threshold + 100, currency: 'USD', payoutMethod: 'paypal',
        description: 'Test expense for drink',
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: 'https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg',
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const secondExpense = await utils.graphqlQuery(createExpenseQuery, { expense: secondExpenseData }, user);
      secondExpense.errors && console.error(secondExpense.errors);
      expect(secondExpense.errors).to.not.exist;
      expect(secondExpense.data.createExpense.status).to.be.equal('PENDING');
      expect(secondExpense.data.createExpense.user.id).to.be.equal(user.id);

      // Second expense Does Not Generate Any new Comment
      const numberOfCommentsAfterAddExpense = await models.Comment.count();
      expect(numberOfComments).to.be.equal(numberOfCommentsAfterAddExpense);
    });/* End of "creates 2 new expenses that adds up more than W9 Bot threshold(each) and DO NOT create a new Bot Comment after the first one" */

    it('creates 2 new expenses that adds up more than the W9 Bot Threshold and create Comment expense forms email', async () => {
      // Given a collective in EUR with a host in USD
      const { collective } = await store.newCollectiveWithHost('Test Collective', 'EUR', 'USD', 10);

      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');

      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');

      // And given the W9 Bot THRESHOLD
      const w9Bot = await models.Collective.findOne({
        where: {
          slug: W9_BOT_SLUG
        }
      });
      const threshold = get(w9Bot, 'settings.W9.threshold');
      expect(threshold).to.be.above(0);

      // When the first expense is created
      const firstExpenseData = {
        amount: threshold/2, currency: 'EUR', payoutMethod: 'paypal',
        description: 'Test expense for pizza',
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: 'https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg',
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const firstExpense = await utils.graphqlQuery(createExpenseQuery, { expense: firstExpenseData }, user);
      firstExpense.errors && console.error(firstExpense.errors);
      expect(firstExpense.errors).to.not.exist;
      expect(firstExpense.data.createExpense.status).to.be.equal('PENDING');
      expect(firstExpense.data.createExpense.user.id).to.be.equal(user.id);

      // First expense triggers only one email(admin warning)
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
      expect(emailSendMessageSpy.callCount).to.be.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.be.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain('New expense on');
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain('/test-collective/expenses/1/approve');

      // When second expense is created
      const secondExpenseData = {
        amount: threshold, currency: 'EUR', payoutMethod: 'paypal',
        description: 'Test expense for drink',
        privateMessage: 'Private instructions to reimburse this expense',
        attachment: 'https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg',
        incurredAt: new Date,
        collective: { id: collective.id }
      };
      const secondExpense = await utils.graphqlQuery(createExpenseQuery, { expense: secondExpenseData }, user);
      secondExpense.errors && console.error(secondExpense.errors);
      expect(secondExpense.errors).to.not.exist;
      expect(secondExpense.data.createExpense.status).to.be.equal('PENDING');
      expect(secondExpense.data.createExpense.user.id).to.be.equal(user.id);

      // Second expense triggers 2 emails(admin warning and new comment)
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 2);
      expect(emailSendMessageSpy.callCount).to.be.equal(3);

    });/* End of "creates 2 new expenses that adds up more than the W9 Bot Threshold and create Comment expense forms email" */

    it('Host Data must NOT include user in W9 Received List if he didn\'t spend more than W9 Threshold after Expense is Created', async () => {
      // Given that we have a collective
      const { hostCollective, collective } = await store.newCollectiveWithHost('rollup', 'USD', 'USD', 10);
      // And given a user that will file an expense
      const { user } = await store.newUser('an internet user', { paypalEmail: 'testuser@paypal.com' });
      // And given the above collective has one expense (created by
      // the above user)
      const data = {
        currency: 'USD', payoutMethod: 'paypal',
        privateMessage: 'Private instructions to reimburse this expense',
        collective: { id: collective.id },
      };
      await store.createExpense(user, { amount: 1, description: 'Pizza', ...data });

      // And then the host data has to be null
      const updatedHost = await models.Collective.findById(hostCollective.id);
      expect(updatedHost.data).to.be.null;
    });/* End of "Host Data must NOT include user in W9 Received List if he didn\'t spend more than W9 Threshold after Expense is Approved" */

    const addFunds = async (user, hostCollective, collective, amount) => {
      await models.Transaction.create({
        CreatedByUserId: user.id,
        HostCollectiveId: hostCollective.id,
        type: 'CREDIT',
        netAmountInCollectiveCurrency: amount,
        currency: 'USD',
        CollectiveId: collective.id
      });
    };

    it('After User Expense is Paid and User Expenses exceed W9 threshold, Host Data must include user in W9 Received List', async () => {
      // Given that we have a collective
      const {  hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost('rollup', 'USD', 'USD', 10);
      // And given a user that will file an expense
      const { user } = await store.newUser('an internet user', { paypalEmail: 'testuser@paypal.com' });
      // And given the W9 Bot information
      const w9Bot = await models.Collective.findOne({
        where: {
          slug: W9_BOT_SLUG
        }
      });
      // Get Bot Threshold
      const threshold = get(w9Bot, 'settings.W9.threshold');
      expect(threshold).to.be.above(0);

      // Then creates the first expense that exceeds the threshold
      const expenseData = {
        currency: 'USD', payoutMethod: 'other',
        privateMessage: 'First expense',
        collective: { id: collective.id },
      };
      await store.createExpense(user, { amount: threshold + 100, description: "Pizza", ...expenseData });

      // Created Expense triggers "New Comment" email
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
      expect(emailSendMessageSpy.callCount).to.be.equal(1);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain('New comment');

      // And then the host must have the user included in his W9.requestSentToUserIds List
      const hostAfterCreatedExpense = await models.Collective.findById(collective.HostCollectiveId);
      expect(hostAfterCreatedExpense.data).to.exist;
      expect(get(hostAfterCreatedExpense, 'data.W9.requestSentToUserIds')).to.exist;
      expect(get(hostAfterCreatedExpense, 'data.W9.requestSentToUserIds')).to.have.lengthOf(1);
      expect(get(hostAfterCreatedExpense, 'data.W9.requestSentToUserIds')[0]).to.be.equal(user.id);

      // And then another expense is createdexpense. = '';
      const expense2 = await store.createExpense(user, { amount: 100, payoutMethod: 'other', description: 'tet', ...expenseData });

      // And When the expense is approved by the admin of host
      const result = await utils.graphqlQuery(approveExpenseQuery, { id: expense2.id }, hostAdmin);
      result.errors && console.error(result.errors);

      // And then add funds to the collective
      await addFunds(user, hostCollective, collective, expense2.amount*10);
      const balance = await collective.getBalance();
      expect(balance).to.equal(expense2.amount*10);

      // Then there should be no errors in the result
      expect(result.errors).to.not.exist;
      // And then the expense status should be set as APPROVED
      expect(result.data.approveExpense.status).to.be.equal('APPROVED');

      // Approved expense triggers one email as well
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 2);

      // When the expense is paid
      const parameters = { id: expense2.id, fee: 0 };
      await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);

      // Pay expense triggers one email as well
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 3);

      // Refetching host data again after expense is approved
      const hostAfterPaidExpense = await models.Collective.findById(collective.HostCollectiveId);
      // Host.data.W9.receivedFromUserIds must include user
      expect(hostAfterPaidExpense.data).to.exist;
      expect(get(hostAfterPaidExpense, 'data.W9.receivedFromUserIds')).to.exist;
      expect(get(hostAfterPaidExpense, 'data.W9.receivedFromUserIds')).to.have.lengthOf(1);
      expect(get(hostAfterPaidExpense, 'data.W9.receivedFromUserIds')[0]).to.be.equal(user.id);
    });/* End of "After User Expenses exceed W9 threshold, Host Data must include user in W9 Received List" */

    it('User that\'s already in Host Data(W9 Received List) Must not be included again', async () => {
      // Given that we have a collective
      const {  hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost('rollup', 'USD', 'USD', 10);
      // And given a user that will file an expense
      const { user } = await store.newUser('an internet user', { paypalEmail: 'testuser@paypal.com' });
      // And given the W9 Bot information
      const w9Bot = await models.Collective.findOne({
        where: {
          slug: W9_BOT_SLUG
        }
      });
      // Get Bot Threshold
      const threshold = get(w9Bot, 'settings.W9.threshold');
      expect(threshold).to.be.above(0);

      // Then creates the first expense that exceeds the threshold
      const expenseData = {
        currency: 'USD', payoutMethod: 'other',
        privateMessage: 'First expense',
        collective: { id: collective.id },
      };
      await store.createExpense(user, { amount: threshold + 100, description: "Pizza", ...expenseData });

      // Created Expense triggers "New Comment" email
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
      expect(emailSendMessageSpy.callCount).to.be.equal(1);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain('New comment');

      // And then the host must have the user included in his W9.requestSentToUserIds List
      const hostAfterCreatedExpense = await models.Collective.findById(collective.HostCollectiveId);
      expect(hostAfterCreatedExpense.data).to.exist;
      expect(get(hostAfterCreatedExpense, 'data.W9.requestSentToUserIds')).to.exist;
      expect(get(hostAfterCreatedExpense, 'data.W9.requestSentToUserIds')).to.have.lengthOf(1);
      expect(get(hostAfterCreatedExpense, 'data.W9.requestSentToUserIds')[0]).to.be.equal(user.id);

      // And then another expense is createdexpense. = '';
      const expense2 = await store.createExpense(user, { amount: 100, payoutMethod: 'other', description: 'tet', ...expenseData });

      // And When the expense is approved by the admin of host
      const result = await utils.graphqlQuery(approveExpenseQuery, { id: expense2.id }, hostAdmin);
      result.errors && console.error(result.errors);

      // And then add funds to the collective
      await addFunds(user, hostCollective, collective, expense2.amount*100);
      const balance = await collective.getBalance();
      expect(balance).to.equal(expense2.amount*100);

      // Then there should be no errors in the result
      expect(result.errors).to.not.exist;
      // And then the expense status should be set as APPROVED
      expect(result.data.approveExpense.status).to.be.equal('APPROVED');

      // Approved expense triggers one email as well
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 2);

      // When the expense is paid
      let parameters = { id: expense2.id, fee: 0 };
      await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);

      // Pay expense triggers one email as well
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 3);

      // Refetching host data again after expense is approved
      const hostAfterPaidExpense = await models.Collective.findById(collective.HostCollectiveId);
      // Host.data.W9.receivedFromUserIds must include user
      expect(hostAfterPaidExpense.data).to.exist;
      expect(get(hostAfterPaidExpense, 'data.W9.receivedFromUserIds')).to.exist;
      expect(get(hostAfterPaidExpense, 'data.W9.receivedFromUserIds')).to.have.lengthOf(1);
      expect(get(hostAfterPaidExpense, 'data.W9.receivedFromUserIds')[0]).to.be.equal(user.id);

      // And then another expense is created
      const expense3 = await store.createExpense(user, { amount: 100, description: 'expense 3', ...expenseData });

      // Then the expense is approved by the admin of host
      const result2 = await utils.graphqlQuery(approveExpenseQuery, { id: expense3.id }, hostAdmin);
      result.errors && console.error(result.errors);

      // Then there should be no errors in the result
      expect(result2.errors).to.not.exist;
      // And then the expense status should be set as APPROVED
      expect(result2.data.approveExpense.status).to.be.equal('APPROVED');

      // Then the expense is paid
      parameters = { id: expense3.id, fee: 0 };
      await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);

      // Refetching host data again after expense is approved
      const hostAfterThirdExpense = await models.Collective.findById(collective.HostCollectiveId);
      // Host.data.W9.receivedFromUserIds must include user ONLY ONE time
      expect(hostAfterThirdExpense.data).to.exist;
      expect(get(hostAfterThirdExpense, 'data.W9.receivedFromUserIds')).to.exist;
      expect(get(hostAfterThirdExpense, 'data.W9.receivedFromUserIds')).to.have.lengthOf(1);
      expect(get(hostAfterThirdExpense, 'data.W9.receivedFromUserIds')[0]).to.be.equal(user.id);
    });/* End of "User that\'s already in Host Data(W9 Received List) Must not be included again" */

  }); /* End of "#createCommentForExpenses" */
}); /* End of "w9.bot.test.js" */
