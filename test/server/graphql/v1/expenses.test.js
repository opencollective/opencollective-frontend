/** @module test/graphql.expenses.test
 *
 * This tests all the GraphQL API methods that interact with
 * expenses. */

/* Test libraries */
import sinon from 'sinon';
import { expect } from 'chai';

/* Test utilities */
import { pick } from 'lodash';
import * as utils from '../../../utils';
import * as store from '../../../stores';

/* Support code */
import models from '../../../../server/models';
import emailLib from '../../../../server/lib/email';
import { getFxRate } from '../../../../server/lib/currency';

import paypalAdaptive from '../../../../server/paymentProviders/paypal/adaptiveGateway';
import paymentProviders from '../../../../server/paymentProviders';

import {
  fakeConnectedAccount,
  fakeExpense,
  fakeUser,
  fakeExpenseAttachment,
  fakeCollective,
  randStr,
  fakePayoutMethod,
} from '../../../test-helpers/fake-data';
import { roles } from '../../../../server/constants';
import expenseStatus from '../../../../server/constants/expense_status';
import { PayoutMethodTypes } from '../../../../server/models/PayoutMethod';

/* Queries used throughout these tests */
const allExpensesQuery = `
  query allExpenses($CollectiveId: Int!, $category: String, $fromCollectiveSlug: String, $limit: Int, $includeHostedCollectives: Boolean) {
    allExpenses(CollectiveId: $CollectiveId, category: $category, fromCollectiveSlug: $fromCollectiveSlug, limit: $limit, includeHostedCollectives: $includeHostedCollectives) {
      id
      description
      amount
      category
      user { id email collective { id slug } }
      collective { id slug } 
      attachment
    } 
  }`;

const expensesQuery = `
  query expenses($CollectiveId: Int, $CollectiveSlug: String, $category: String, $FromCollectiveId: Int, $FromCollectiveSlug: String, $status: ExpenseStatus, $offset: Int, $limit: Int, $orderBy: OrderByType) {
    expenses(CollectiveId: $CollectiveId, CollectiveSlug: $CollectiveSlug, category: $category, FromCollectiveId: $FromCollectiveId, FromCollectiveSlug: $FromCollectiveSlug, status: $status, offset: $offset, limit: $limit, orderBy: $orderBy) {
      expenses {
        id
        description
        amount
        category
        user { id email collective { id slug } }
        collective { id slug }
      }
    }
  }
`;

const expenseQuery = `
  query expense($id: Int!) {
    Expense(id: $id) {
      id
      description
      amount
      category
      user { id email collective { id slug } }
      collective { id slug }
      attachment
      attachments {
        id
        amount
        description
        url
      }
    }
  }
`;

const createExpenseQuery = `
  mutation createExpense($expense: ExpenseInputType!) {
    createExpense(expense: $expense) {
      id
      status
      user { id name collective { id name slug } }
      amount
      attachment
      attachments {
        id
        url
        amount
        description
        incurredAt
      } 
    } 
  }`;

const editExpenseMutation = `
  mutation editExpense($expense: ExpenseInputType!) {
    editExpense(expense: $expense) {
      id
      status
      user { id name collective { id name slug } }
      amount
      attachment
      attachments {
        id
        url
        amount
        description
        incurredAt
      } 
    } 
  }`;

const approveExpenseQuery = `
  mutation approveExpense($id: Int!) {
    approveExpense(id: $id) { id status } }`;

const deleteExpenseQuery = `
  mutation deleteExpense($id: Int!) { deleteExpense(id: $id) { id } }`;

const payExpenseQuery = `
  mutation payExpense($id: Int!, $paymentProcessorFeeInCollectiveCurrency: Int, $hostFeeInCollectiveCurrency: Int, $platformFeeInCollectiveCurrency: Int) {
    payExpense(id: $id, paymentProcessorFeeInCollectiveCurrency: $paymentProcessorFeeInCollectiveCurrency, hostFeeInCollectiveCurrency: $hostFeeInCollectiveCurrency, platformFeeInCollectiveCurrency: $platformFeeInCollectiveCurrency) { id status } }`;

const markExpenseAsUnpaidQuery = `
  mutation markExpenseAsUnpaid($id: Int!, $processorFeeRefunded: Boolean!) {
    markExpenseAsUnpaid(id: $id, processorFeeRefunded: $processorFeeRefunded) { id status } }`;

const unapproveExpenseQuery = `
  mutation unapproveExpense($id: Int!) {
    unapproveExpense(id: $id) { id status } }
`;

const addFunds = async (user, hostCollective, collective, amount) => {
  const currency = collective.currency || 'USD';
  const hostCurrencyFxRate = await getFxRate(currency, hostCollective.currency);
  const amountInHostCurrency = Math.round(hostCurrencyFxRate * amount);
  await models.Transaction.create({
    CreatedByUserId: user.id,
    HostCollectiveId: hostCollective.id,
    type: 'CREDIT',
    amount,
    amountInHostCurrency,
    hostCurrencyFxRate,
    netAmountInCollectiveCurrency: amount,
    hostCurrency: hostCollective.currency,
    currency,
    CollectiveId: collective.id,
  });
};

describe('server/graphql/v1/expenses', () => {
  beforeEach(async () => {
    await utils.resetTestDB();
  });

  beforeEach(async () => {
    await utils.resetCaches();
  });

  describe('#allExpenses', () => {
    it('fails if collective not found', async () => {
      // Given we have no collective with id 999999
      // When we try to retrieve expenses from an invalid collective
      const result = await utils.graphqlQuery(allExpensesQuery, {
        CollectiveId: 999999,
      });
      // Then we should see an error
      expect(result.errors).to.exist;
      // And then the error message should be appropriate
      expect(result.errors[0].message).to.equal('Collective not found');
    }); /* End of "fails if collective not found" */

    it('gets no expenses if collective has no expenses', async () => {
      // Given that we have a collective with no expenses
      const { collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // When we retrieve all its expenses
      const result = await utils.graphqlQuery(allExpensesQuery, {
        CollectiveId: collective.id,
      });
      result.errors && console.log(result.errors);
      // Then there should be no errors
      expect(result.errors).to.not.exist;
      // And then it should retrieve no expenses
      expect(result.data.allExpenses).to.have.length(0);
    }); /* End of "gets no expenses if collective has no expenses" */

    it('gets the latest expenses from one collective', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // And given the above collective has some expenses
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 2000 }],
        amount: 2000,
        description: 'Beer',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 3000 }],
        amount: 3000,
        description: 'Banner',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 4000 }],
        amount: 4000,
        description: 'Stickers',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 5000 }],
        amount: 5000,
        description: 'T-shirts',
        ...data,
      });
      // When we retrieve all its expenses
      const result = await utils.graphqlQuery(allExpensesQuery, {
        CollectiveId: collective.id,
        limit: 5,
      });
      result.errors && console.log(result.errors);
      expect(result.errors).to.not.exist;
      // Then it should retrieve the right amount of expenses
      const expenses = result.data.allExpenses;
      expect(expenses).to.have.length(5);
      // And then the expenses retrieved should come from the same
      // collective
      expect(expenses.map(e => e.collective.slug)).to.deep.equal([
        'railsgirlsatl',
        'railsgirlsatl',
        'railsgirlsatl',
        'railsgirlsatl',
        'railsgirlsatl',
      ]);
    }); /* End of "gets the latest expenses from one collective" */

    it('gets the latest expenses from all the hosted collectives', async () => {
      // Given that we have two collectives within a host
      const { hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost('apex', 'USD', 'USD', 10);
      const anotherCollective = (await store.newCollectiveInHost('brusselstogether', 'USD', hostCollective)).collective;
      const inactiveCollective = (await store.newCollectiveInHost('womer-inactive', 'USD', hostCollective)).collective;
      inactiveCollective.isActive = false;
      await inactiveCollective.save();
      // And given that the first collective created above have two expenses
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 2000 }],
        amount: 2000,
        description: 'Beer',
        ...data,
      });
      // And given that the second collective created above also have
      // two expenses
      data.collective = { id: anotherCollective.id };
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 3000 }],
        amount: 3000,
        description: 'Banner',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 4000 }],
        amount: 4000,
        description: 'Stickers',
        ...data,
      });
      // And given that the inactive collective created above also has
      // one expense
      data.collective = { id: inactiveCollective.id };
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 3500 }],
        amount: 3500,
        description: 'Banner inactive',
        ...data,
      });
      // When we retrieve all the expenses of the host
      const result = await utils.graphqlQuery(allExpensesQuery, {
        CollectiveId: hostCollective.id,
        limit: 5,
        includeHostedCollectives: true,
      });
      result.errors && console.log(result.errors);
      // Then there should be no errors in the response
      expect(result.errors).to.not.exist;
      // And then there should be four expenses in total since we're
      // counting the two collectives hosted by `hostCollective`.
      expect(result.data.allExpenses).to.have.length(4);
      expect(result.data.allExpenses.map(e => e.collective.slug)).to.deep.equal([
        'brusselstogether',
        'brusselstogether',
        'apex',
        'apex',
      ]);
    }); /* End of "gets the latest expenses from all the hosted collectives" */

    it('gets the latest expenses from all the hosted collectives for one category', async () => {
      // Given that we have two collectives within a host
      const { hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost('apex', 'USD', 'USD', 10);
      const anotherCollective = (await store.newCollectiveInHost('babel', 'USD', hostCollective)).collective;
      // And given that the first collective created above have two
      // expenses but just one categorized as `legal`.
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        category: 'legal',
        description: 'Pizza',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 2000 }],
        amount: 2000,
        category: 'treat',
        description: 'Beer',
        ...data,
      });
      // And given that the second collective created above also have
      // two expenses but just one categorized as `legal`.
      data.collective = { id: anotherCollective.id };
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 3000 }],
        amount: 3000,
        category: 'legal',
        description: 'Banner',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 4000 }],
        amount: 4000,
        category: 'stuff',
        description: 'Stickers',
        ...data,
      });
      // When we retrieve all the expenses of the host
      const result = await utils.graphqlQuery(allExpensesQuery, {
        category: 'legal',
        CollectiveId: hostCollective.id,
        limit: 5,
        includeHostedCollectives: true,
      });
      result.errors && console.log(result.errors);
      // Then there should be no errors in the response
      expect(result.errors).to.not.exist;
      // And then there should be two expenses in total since we're
      // counting expenses from the two collectives hosted by
      // `hostCollective` that are under the `legal` category.
      expect(result.data.allExpenses).to.have.length(2);
      result.data.allExpenses.forEach(e => expect(e.category).to.equal('legal'));
    }); /* End of "gets the latest expenses from all the hosted collectives for one category" */

    it('gets the latest expenses from all the hosted collectives for one author', async () => {
      // Given a user that will file expenses
      const xdamman = (await store.newUser('xdamman')).user;
      // And given that we have two collectives within a host
      const { hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost('apex', 'USD', 'USD', 10);
      const anotherCollective = (await store.newCollectiveInHost('babel', 'USD', hostCollective)).collective;
      // And given that the first collective created above have two
      // expenses but just one filed by our user
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      await store.createExpense(xdamman, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        category: 'legal',
        description: 'Pizza',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 2000 }],
        amount: 2000,
        category: 'treat',
        description: 'Beer',
        ...data,
      });
      // And given that the second collective created above also have
      // two expenses but just one filed by our user
      data.collective = { id: anotherCollective.id };
      await store.createExpense(xdamman, {
        attachments: [{ url: store.randUrl(), amount: 3000 }],
        amount: 3000,
        category: 'legal',
        description: 'Banner',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 4000 }],
        amount: 4000,
        category: 'stuff',
        description: 'Stickers',
        ...data,
      });
      // When we retrieve all the expenses of the host
      const result = await utils.graphqlQuery(allExpensesQuery, {
        fromCollectiveSlug: 'xdamman',
        CollectiveId: hostCollective.id,
        limit: 5,
        includeHostedCollectives: true,
      });
      result.errors && console.log(result.errors);
      // Then there should be no errors in the response
      expect(result.errors).to.not.exist;
      // And then there should be two expenses in total since we're
      // counting expenses from the two collectives hosted by
      // `hostCollective` that were created by xdamman and not by the
      // host owner.
      expect(result.data.allExpenses).to.have.length(2);
      result.data.allExpenses.forEach(e => expect(e.user.collective.slug).to.equal('xdamman'));
    }); /* End of "gets the latest expenses from all the hosted collectives for one author" */
  }); /* End of "#allExpenses" */

  describe('#expenses', () => {
    it('gets no expenses if collective has no expenses', async () => {
      // Given that we have a collective with no expenses
      const { collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // When we retrieve all its expenses
      const {
        errors,
        data: {
          expenses: { expenses },
        },
      } = await utils.graphqlQuery(expensesQuery, {
        CollectiveId: collective.id,
      });
      // Then there should be no errors
      expect(errors).to.not.exist;
      // And then it should retrieve no expenses
      expect(expenses).to.have.length(0);
    }); /* End of "gets no expenses if collective has no expenses" */

    it('gets the latest expenses', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // And given the above collective has some expenses
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 2000 }],
        amount: 2000,
        description: 'Beer',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 3000 }],
        amount: 3000,
        description: 'Banner',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 4000 }],
        amount: 4000,
        description: 'Stickers',
        ...data,
      });
      await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 5000 }],
        amount: 5000,
        description: 'T-shirts',
        ...data,
      });
      // When we retrieve all its expenses
      const {
        errors,
        data: {
          expenses: { expenses },
        },
      } = await utils.graphqlQuery(expensesQuery, {
        CollectiveId: collective.id,
        limit: 5,
      });
      expect(errors).to.not.exist;
      // Then it should retrieve the right amount of expenses
      expect(expenses).to.have.length(5);
      // And then the expenses retrieved should come from the same
      // collective
      expect(expenses.map(e => e.description)).to.deep.equal(['T-shirts', 'Stickers', 'Banner', 'Beer', 'Pizza']);
    }); /* End of "gets the latest expenses from one collective" */
  });

  describe('#expense', () => {
    it('hides attachment if not allowed to see', async () => {
      const host = await fakeCollective({ type: 'ORGANIZATION' });
      const collective = await fakeCollective({ HostCollectiveId: host.id });
      const expense = await fakeExpense({ CollectiveId: collective.id, attachments: [] });
      const attachment = await fakeExpenseAttachment({ ExpenseId: expense.id });
      const collectiveAdmin = await fakeUser();
      await collective.addUserWithRole(collectiveAdmin, roles.ADMIN);
      const hostAdmin = await fakeUser();
      await host.addUserWithRole(hostAdmin, roles.ADMIN);

      // Fetch as unauthenticated (should not have URL)
      let result = await utils.graphqlQuery(expenseQuery, { id: expense.id });
      expect(result.data.Expense.attachment).to.be.null;
      result.data.Expense.attachments.forEach(attachmentFromAPI => {
        expect(attachmentFromAPI.url).to.be.null;
      });

      // Fetch as another user (should not have URL)
      const randomUser = await fakeUser();
      result = await utils.graphqlQuery(expenseQuery, { id: expense.id }, randomUser);
      expect(result.data.Expense.attachment).to.be.null;
      result.data.Expense.attachments.forEach(attachmentFromAPI => {
        expect(attachmentFromAPI.url).to.be.null;
      });

      // Fetch as expense's creator (should have URL)
      result = await utils.graphqlQuery(expenseQuery, { id: expense.id }, expense.User);
      expect(result.data.Expense.attachment).to.eq(attachment.url);
      result.data.Expense.attachments.forEach(attachmentFromAPI => {
        expect(attachmentFromAPI.url).to.eq(attachment.url);
      });

      // Fetch as collective admin (should have URL)
      result = await utils.graphqlQuery(expenseQuery, { id: expense.id }, collectiveAdmin);
      expect(result.data.Expense.attachment).to.eq(attachment.url);
      result.data.Expense.attachments.forEach(attachmentFromAPI => {
        expect(attachmentFromAPI.url).to.eq(attachment.url);
      });

      // Fetch as host admin (should have URL)
      result = await utils.graphqlQuery(expenseQuery, { id: expense.id }, hostAdmin);
      expect(result.data.Expense.attachment).to.eq(attachment.url);
      result.data.Expense.attachments.forEach(attachmentFromAPI => {
        expect(attachmentFromAPI.url).to.eq(attachment.url);
      });
    });
  });

  describe('#createExpense', () => {
    let sandbox, emailSendMessageSpy;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
    });

    afterEach(() => sandbox.restore());

    it('fails to create an expense if not logged in', async () => {
      emailSendMessageSpy.resetHistory();
      // Given a collective
      const { collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      await utils.waitForCondition(() => emailSendMessageSpy.callCount === 1, {
        tag: 'Test Collective would love to be hosted',
      });
      emailSendMessageSpy.resetHistory();
      // When it's attempted to create an expense with no user
      const data = {
        currency: 'USD',
        payoutMethod: 'manual',
        collective: { id: collective.id },
      };
      const result = await utils.graphqlQuery(createExpenseQuery, {
        expense: data,
      });
      // Then there should be an error
      expect(result.errors).to.exist;
      // And then the error message should be clear
      expect(result.errors[0].message).to.equal('You need to be logged in to create an expense');
    }); /* End of "fails to create an expense if not logged in" */

    it('creates a new expense logged in and send email to collective admin for approval', async () => {
      emailSendMessageSpy.resetHistory();
      // Given a collective
      const { collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'USD', 10);
      await utils.waitForCondition(() => emailSendMessageSpy.callCount === 1, {
        tag: 'Test Collective would love to be hosted',
      });
      emailSendMessageSpy.resetHistory();
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      await fakePayoutMethod({ type: PayoutMethodTypes.PAYPAL, CollectiveId: user.CollectiveId });
      // When a new expense is created
      const data = {
        amount: 1000,
        currency: 'USD',
        payoutMethod: 'paypal',
        description: 'Test expense for pizza',
        privateMessage: 'Private instructions to reimburse this expense',
        attachment:
          'https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg',
        incurredAt: new Date(),
        collective: { id: collective.id },
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
      expect(result.data.createExpense.attachment).to.equal(data.attachment);
      expect(result.data.createExpense.attachments[0].url).to.equal(data.attachment);

      // And then the user should become a member of the project
      const membership = await models.Member.findOne({
        where: { CollectiveId: collective.id, role: 'CONTRIBUTOR' },
      });
      expect(membership).to.exist;
      expect(membership.MemberCollectiveId).to.equal(user.CollectiveId);

      // And then an email should have been sent to the admin. This
      // call to the function `waitForCondition()` is required because
      // notifications are sent asynchronously.
      await utils.waitForCondition(() => emailSendMessageSpy.callCount === 1, {
        tag: 'New expense on Test Collective',
      });
      expect(emailSendMessageSpy.callCount).to.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.equal(
        'New expense on Test Collective: $10.00 for Test expense for pizza',
      );
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain('/test-collective/expenses/1');

      // XXX: This was just copied over. I don't know what this is
      // actually testing:
      // doesn't scream when adding another expense from same user
      const res = await utils.graphqlQuery(createExpenseQuery, { expense: data }, user);
      expect(res.errors).to.not.exist;
    }); /* End of "creates a new expense logged in and send email to collective admin for approval" */

    it('creates an expense using the new "attachments" field', async () => {
      const user = await fakeUser();
      const collective = await fakeCollective();
      const expenseData = {
        amount: 500,
        description: 'Bought some potatoes',
        type: 'RECEIPT',
        category: 'food',
        collective: { id: collective.id },
        attachments: [
          {
            amount: 250,
            description: 'Burger',
            url: store.randUrl(),
            incurredAt: new Date('2000-01-01T00:00:00'),
          },
          {
            amount: 250,
            description: 'French Fries',
            url: store.randUrl(),
            incurredAt: new Date('2000-01-03T00:00:00'),
          },
        ],
      };

      const result = await utils.graphqlQuery(createExpenseQuery, { expense: expenseData }, user);
      const attachments = result.data.createExpense.attachments;
      expect(result.data.createExpense.amount).to.equal(expenseData.amount);
      attachments.forEach(attachment => {
        const baseData = expenseData.attachments.find(a => a.description === attachment.description);
        expect(baseData.url).to.equal(attachment.url);
        expect(baseData.amount).to.equal(attachment.amount);
      });
    });

    it("fails if attachments amount don't match expense", async () => {
      const user = await fakeUser();
      const collective = await fakeCollective();
      const expenseData = {
        amount: 500,
        description: 'Bought some potatoes',
        type: 'RECEIPT',
        category: 'food',
        collective: { id: collective.id },
        attachments: [
          {
            amount: 250,
            description: 'Burger',
            url: store.randUrl(),
          },
          {
            amount: 400,
            description: 'French Fries',
            url: store.randUrl(),
          },
        ],
      };

      const result = await utils.graphqlQuery(createExpenseQuery, { expense: expenseData }, user);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal(
        "The sum of all attachments must be equal to the total expense's amount. Expense's total is 500, but the total of attachments was 650.",
      );
    });
  }); /* End of "#createExpense" */

  describe('#approveExpense', () => {
    let sandbox, emailSendMessageSpy;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
    });

    afterEach(() => sandbox.restore());

    it('fails to approve expense if expense.status is PAID', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('parcel', 'USD', 'USD', 10);
      // And given the above collective has some expenses
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      // And given that the above expense was already PAID
      await (await models.Expense.findByPk(expense.id)).update({
        status: 'PAID',
      });
      // When there's an attempt to approve an already paid expense
      const result = await utils.graphqlQuery(approveExpenseQuery, { id: expense.id }, hostAdmin);
      // Then there should be an error
      expect(result.errors).to.exist;
      // And then the error message should be set accordingly
      expect(result.errors[0].message).to.equal("You can't approve an expense that is already paid");
    }); /* End of "fails to approve expense if expense.status is PAID" */

    it('successfully approve expense and send notification email to author of expense', async () => {
      emailSendMessageSpy.resetHistory();
      // Given that we have a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('rollup', 'USD', 'USD', 10);
      // And given a user that will file an expense
      const { user } = await store.newUser('an internet user');
      // And given the above collective has one expense (created by
      // the above user)
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'paypal',
        privateMessage: 'Private instructions to reimburse this expense',
        collective: { id: collective.id },
        user: { paypalEmail: store.randEmail() },
      };

      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });

      await utils.waitForCondition(() => emailSendMessageSpy.callCount === 1, {
        tag: 'rollup would love to be hosted',
      });
      emailSendMessageSpy.resetHistory();
      // When the expense is approved by the admin of host
      const result = await utils.graphqlQuery(approveExpenseQuery, { id: expense.id }, hostAdmin);
      result.errors && console.log(result.errors);
      // Then there should be no errors in the result
      expect(result.errors).to.not.exist;
      // And then the approved expense should be set as APPROVED
      expect(result.data.approveExpense.status).to.equal('APPROVED');
      // And then an email should have been sent to the admin and
      // another one to the user. This call to the function
      // `waitForCondition()` is required because notifications are
      // sent asynchronously.
      await utils.waitForCondition(() => emailSendMessageSpy.callCount === 2, {
        tag: 'Your expense to rollup for $10.00 has been approved AND New expense approved on rollup',
      });
      expect(emailSendMessageSpy.callCount).to.equal(2);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain('Your expense');
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain('has been approved');
      expect(emailSendMessageSpy.secondCall.args[0]).to.equal(hostAdmin.email);
      expect(emailSendMessageSpy.secondCall.args[1]).to.contain('New expense approved');
    }); /* End of "successfully approve expense and send notification email to author of expense" */

    it('successfully approve expense and send notification email to admin of host', async () => {
      emailSendMessageSpy.resetHistory();
      // Given a user that will file an expense and that is an admin of the collective
      const { user } = await store.newUser('an internet user');
      const admin = (await store.newUser('collectives-admin')).user;
      // and given that we have a host
      const { hostAdmin, collective } = await store.newCollectiveWithHost('rollup', 'USD', 'USD', 10, admin);
      // approve the collective to be hosted by the host
      collective.isActive = true;
      await collective.save();
      // And given the above collective has one expense (created by
      // the above user)
      const data = {
        currency: 'USD',
        privateMessage: 'Private instructions to reimburse this expense',
        collective: { id: collective.id },
        PayoutMethod: { type: PayoutMethodTypes.PAYPAL, data: { email: 'testuser@paypal.com' } },
      };
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      await utils.waitForCondition(() => emailSendMessageSpy.callCount === 2, {
        tag: 'rollup would love to be hosted AND New expense on rollup',
      });
      emailSendMessageSpy.resetHistory();
      // When the expense is approved by the admin of collective
      const result = await utils.graphqlQuery(approveExpenseQuery, { id: expense.id }, admin);
      result.errors && console.log(result.errors);
      // Then there should be no errors in the result
      expect(result.errors).to.not.exist;
      // And then the approved expense should be set as APPROVED
      expect(result.data.approveExpense.status).to.equal('APPROVED');
      // And then an email should have been sent to the admin and
      // another one to the user. This call to the function
      // `waitForCondition()` is required because notifications are
      // sent asynchronously.
      await utils.waitForCondition(() => emailSendMessageSpy.callCount === 2, {
        tag: 'Your expense to rollup AND New expense approved',
      });
      expect(emailSendMessageSpy.callCount).to.equal(2);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain('Your expense');
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain('has been approved');
      expect(emailSendMessageSpy.secondCall.args[0]).to.equal(hostAdmin.email);
      expect(emailSendMessageSpy.secondCall.args[1]).to.contain('New expense approved on rollup: $10.00 for Pizza');
      expect(emailSendMessageSpy.secondCall.args[2]).to.contain('PayPal (testuser@paypal.com)');
      expect(emailSendMessageSpy.secondCall.args[2]).to.contain('Private instructions to reimburse this expense');
    }); /* End of "successfully approve expense and send notification email to author of expense" */
  }); /* End of "#approveExpense" */

  describe('#rejectExpense', () => {
    // not implemented
  }); /* End of "#rejectExpense" */

  describe('#payExpense', () => {
    let sandbox, emailSendMessageSpy;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
    });

    afterEach(() => sandbox.restore());

    it('fails if expense is not approved (PENDING)', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      });
      // When the expense attempted to be paid
      const parameters = {
        id: expense.id,
        paymentProcessorFeeInCollectiveCurrency: 0,
      };
      const result = await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);
      // Then there should be errors
      expect(result.errors).to.exist;
      // And then the message of the error should be set accordingly
      expect(result.errors[0].message).to.equal(
        'Expense needs to be approved. Current status of the expense: PENDING.',
      );
    }); /* End of "fails if expense is not approved (PENDING)" */

    it('fails if expense is not approved (REJECTED)', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      });
      // And the expense is rejected
      await models.Expense.update({ status: 'REJECTED' }, { where: { id: expense.id } });
      // When the expense attempted to be paid
      const parameters = {
        id: expense.id,
        paymentProcessorFeeInCollectiveCurrency: 0,
      };
      const result = await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);
      // Then there should be errors
      expect(result.errors).to.exist;
      // And then the message of the error should be set accordingly
      expect(result.errors[0].message).to.equal(
        'Expense needs to be approved. Current status of the expense: REJECTED.',
      );
    }); /* End of "fails if expense is not approved (REJECTED)" */

    it('fails if expense is still being processed (PROCESSING)', async () => {
      const { hostAdmin, collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      const expense = await fakeExpense({
        status: 'PROCESSING',
        amount: 10000,
        CollectiveId: collective.id,
        currency: 'USD',
        category: 'Engineering',
        type: 'INVOICE',
        description: 'January Invoice',
      });
      const parameters = {
        id: expense.id,
        paymentProcessorFeeInCollectiveCurrency: 0,
      };
      const result = await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);
      // Then there should be errors
      expect(result.errors).to.exist;
      // And then the message of the error should be set accordingly
      expect(result.errors[0].message).to.include('Expense is currently being processed');
    });

    it('fails if not enough funds', async () => {
      // Given that we have a host and a collective
      const { hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost(
        'railsgirlsatl',
        'USD',
        'USD',
        10,
      );
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      });
      // And given the expense is approved
      expense.status = 'APPROVED';
      expense.legacyPayoutMethod = 'paypal';
      await expense.save();
      // And then add funds to the collective
      await addFunds(user, hostCollective, collective, 500);
      // When the expense is paid by the host admin
      const result = await utils.graphqlQuery(
        payExpenseQuery,
        { id: expense.id, paymentProcessorFeeInCollectiveCurrency: 0 },
        hostAdmin,
      );
      // Then there should be errors
      expect(result.errors).to.exist;
      // And then the error message should be set appropriately
      expect(result.errors[0].message).to.equal(
        "You don't have enough funds to pay this expense. Current balance: $5, Expense amount: $10",
      );
    });

    it('fails if not enough funds to cover the fees', async () => {
      // Given that we have a host and a collective
      const { hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost(
        'railsgirlsatl',
        'USD',
        'USD',
        10,
      );
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      });
      // And given the expense is approved
      expense.status = 'APPROVED';
      expense.legacyPayoutMethod = 'paypal';
      await expense.save();
      // And then add funds to the collective
      await addFunds(user, hostCollective, collective, 1000);
      // When the expense is paid by the host admin
      const parameters = {
        id: expense.id,
        paymentProcessorFeeInCollectiveCurrency: 0,
      };
      const result = await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);
      // Then there should be errors
      expect(result.errors).to.exist;
      // And then the error message should be set appropriately
      expect(result.errors[0].message).to.equal(
        "You don't have enough funds to cover for the fees of this payment method. Current balance: $10, Expense amount: $10, Estimated PAYPAL fees: $1",
      );
    }); /* End of "fails if not enough funds to cover the fees" */

    describe('pay with paypal', () => {
      let hostAdmin, hostCollective, collective, expense, user, callPaypal;

      beforeEach(() => {
        callPaypal = sandbox.stub(paypalAdaptive, 'callPaypal').callsFake(() => {
          return Promise.reject(
            new Error(
              'PayPal error: The total amount of all payments exceeds the maximum total amount for all payments (error id: 579031)',
            ),
          );
        });
      });

      beforeEach(async () => {
        // Given that we have a host and a collective
        ({ hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost(
          'WWCode Berlin',
          'EUR',
          'USD',
          10,
        ));

        // And given a user to file expenses
        ({ user } = await store.newUser('someone cool', {
          paypalEmail: 'paypal@user.com',
        }));
        await models.PaymentMethod.create({
          name: 'paypal@host.com',
          service: 'paypal',
          token: 'PA-1EF10938G1481222S',
          CollectiveId: hostCollective.id,
          confirmedAt: new Date(),
        });
        // And given the above collective has one expense (in PENDING
        // state)
        expense = await store.createExpense(user, {
          attachments: [{ url: store.randUrl(), amount: 1000 }],
          amount: 1000,
          description: 'Pizza',
          currency: 'EUR',
          legacyPayoutMethod: 'paypal',
          collective: { id: collective.id },
          PayoutMethod: { type: PayoutMethodTypes.PAYPAL, data: { email: store.randEmail() } },
        });

        // And given the expense is approved
        expense.status = 'APPROVED';
        expense.save();
      });

      it('fails if not enough funds on the paypal preapproved key', async () => {
        // And then add funds to the collective
        const initialBalance = 1500;
        const paymentProcessorFeeInCollectiveCurrency = 100;
        await addFunds(user, hostCollective, collective, initialBalance);
        // When the expense is paid by the host admin
        const res = await utils.graphqlQuery(
          payExpenseQuery,
          { id: expense.id, paymentProcessorFeeInCollectiveCurrency },
          hostAdmin,
        );
        // res.errors && console.log(res.errors);
        expect(callPaypal.firstCall.args[0]).to.equal('pay');
        expect(callPaypal.firstCall.args[1].currencyCode).to.equal('EUR');
        expect(callPaypal.firstCall.args[1].memo).to.equal('Reimbursement from WWCode Berlin: Pizza');
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.contain('Not enough funds in your existing Paypal preapproval');
        const updatedExpense = await models.Expense.findByPk(expense.id);
        expect(updatedExpense.status).to.equal('APPROVED');
        const transactions = await models.Transaction.findAll({ where: { ExpenseId: expense.id } });
        expect(transactions.length).to.equal(0);
      }); /* End of "fails if not enough funds on the paypal preapproved key" */
    });

    describe('pay with transferwise', () => {
      const fee = 1.74;
      let hostAdmin, hostCollective, collective, expense, user, getTemporaryQuote;

      beforeEach(() => {
        getTemporaryQuote = sandbox.stub(paymentProviders.transferwise, 'getTemporaryQuote').resolves({ fee });
        sandbox.stub(paymentProviders.transferwise, 'payExpense').resolves({ quote: { fee } });
      });

      beforeEach(async () => {
        // Given that we have a host and a collective
        ({ hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost(
          'WWCode Berlin',
          'EUR',
          'USD',
          10,
        ));
        // And given a user to file expenses
        ({ user } = await store.newUser('someone cool'));
        await addFunds(user, hostCollective, collective, 15000000);
        await fakeConnectedAccount({
          CollectiveId: hostCollective.id,
          service: 'transferwise',
          token: 'faketoken',
          data: { type: 'business', id: 0 },
        });
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
          payoutMethod: 'transferwise',
          status: expenseStatus.APPROVED,
          amount: 1000000,
          CollectiveId: collective.id,
          currency: 'USD',
          PayoutMethodId: payoutMethod.id,
          category: 'Engineering',
          type: 'INVOICE',
          description: 'January Invoice',
        });
      });

      it('includes TransferWise fees', async () => {
        await utils.graphqlQuery(payExpenseQuery, { id: expense.id }, hostAdmin);

        const [transaction] = await models.Transaction.findAll({ where: { ExpenseId: expense.id } });

        expect(getTemporaryQuote.called).to.be.true;
        expect(transaction)
          .to.have.nested.property('paymentProcessorFeeInHostCurrency')
          .to.equal(Math.round(fee * -100));
      });

      it('should update expense status to PROCESSING', async () => {
        await utils.graphqlQuery(payExpenseQuery, { id: expense.id }, hostAdmin);

        await expense.reload();
        expect(expense.status).to.equal(expenseStatus.PROCESSING);
      });
    });

    describe('success', () => {
      let hostAdmin, hostCollective, collective, expense, user;

      beforeEach(async () => {
        // Given that we have a host and a collective
        ({ hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost(
          'WWCode Berlin',
          'EUR',
          'USD',
          10,
        ));

        // And given a user to file expenses
        ({ user } = await store.newUser('someone cool', {
          paypalEmail: 'paypal@user.com',
        }));

        // And given the above collective has one expense (in PENDING
        // state)
        expense = await store.createExpense(user, {
          attachments: [{ url: store.randUrl(), amount: 1000 }],
          amount: 1000,
          description: 'Pizza',
          currency: 'EUR',
          legacyPayoutMethod: 'manual',
          collective: { id: collective.id },
        });

        // And given the expense is approved
        expense.status = 'APPROVED';
      });

      it('pays the expense manually and reduces the balance of the collective', async () => {
        emailSendMessageSpy.resetHistory();
        expense.legacyPayoutMethod = 'other';
        await expense.save();
        // And then add funds to the collective
        const initialBalance = 1500;
        const paymentProcessorFeeInCollectiveCurrency = 100;
        const hostFeeInCollectiveCurrency = 200;
        const platformFeeInCollectiveCurrency = 150;
        await addFunds(user, hostCollective, collective, initialBalance);
        // When the expense is paid by the host admin
        let balance = await collective.getBalance();
        expect(balance).to.equal(1500);
        const res = await utils.graphqlQuery(
          payExpenseQuery,
          {
            id: expense.id,
            paymentProcessorFeeInCollectiveCurrency,
            hostFeeInCollectiveCurrency,
            platformFeeInCollectiveCurrency,
          },
          hostAdmin,
        );
        res.errors && console.log(res.errors);
        expect(res.errors).to.not.exist;
        expect(res.data.payExpense.status).to.equal('PAID');
        balance = await collective.getBalance();
        const expensePlusFees =
          expense.amount +
          paymentProcessorFeeInCollectiveCurrency +
          hostFeeInCollectiveCurrency +
          platformFeeInCollectiveCurrency;
        expect(balance).to.equal(initialBalance - expensePlusFees);
        await utils.waitForCondition(() => emailSendMessageSpy.callCount === 4);
        const debitTransaction = await models.Transaction.findOne({
          where: {
            type: 'DEBIT',
            ExpenseId: expense.id,
          },
        });
        expect(debitTransaction.currency).to.equal('EUR'); // expense.currency
        expect(debitTransaction.hostCurrency).to.equal('USD');
        expect(debitTransaction.netAmountInCollectiveCurrency).to.equal(-expensePlusFees);
        expect(debitTransaction.paymentProcessorFeeInHostCurrency).to.equal(
          Math.round(-paymentProcessorFeeInCollectiveCurrency * debitTransaction.hostCurrencyFxRate),
        );
        const creditTransaction = await models.Transaction.findOne({
          where: {
            type: 'CREDIT',
            ExpenseId: expense.id,
          },
        });
        expect(creditTransaction.netAmountInCollectiveCurrency).to.equal(expense.amount);
        expect(creditTransaction.amount).to.equal(expensePlusFees);
        expect(emailSendMessageSpy.callCount).to.equal(4);
        expect(emailSendMessageSpy.args[0][0]).to.equal(user.email);
        expect(emailSendMessageSpy.args[0][1]).to.contain('Your expense to WWCode Berlin');
        expect(emailSendMessageSpy.args[0][1]).to.contain('has been approved');
        expect(emailSendMessageSpy.args[1][0]).to.equal(hostAdmin.email);
        expect(emailSendMessageSpy.args[1][1]).to.contain('New expense approved on WWCode Berlin');
        expect(emailSendMessageSpy.args[2][0]).to.equal(user.email);
        expect(emailSendMessageSpy.args[2][1]).to.contain('from WWCode Berlin for Pizza');
        expect(emailSendMessageSpy.args[3][0]).to.equal(hostAdmin.email);
        expect(emailSendMessageSpy.args[3][1]).to.contain('Expense paid on WWCode Berlin');
      }); /* End of "pays the expense manually and reduces the balance of the collective" */

      it('Mark expense as paid if expense paypal is the same as host paypal', async () => {
        emailSendMessageSpy.resetHistory();

        // payout the expense using paypal
        const payoutMethod = await fakePayoutMethod({
          type: PayoutMethodTypes.PAYPAL,
          CollectiveId: hostCollective.id,
        });
        expense.CollectiveId = collective.id;
        expense.legacyPayoutMethod = 'paypal';
        expense.PayoutMethodId = payoutMethod.id;
        await expense.save();

        // Make sure the host is using the same paypal email
        await models.PaymentMethod.create({
          CollectiveId: hostCollective.id,
          service: 'paypal',
          name: payoutMethod.data.email,
          token: 'xxx',
          confirmedAt: new Date(),
        });
        // And then add funds to the collective
        const initialBalance = 1500;
        await addFunds(user, hostCollective, collective, initialBalance);

        // When the expense is paid by the host admin
        let balance = await collective.getBalance();
        expect(balance).to.equal(1500);
        const res = await utils.graphqlQuery(
          payExpenseQuery,
          { id: expense.id, paymentProcessorFeeInCollectiveCurrency: 0 },
          hostAdmin,
        );
        res.errors && console.log(res.errors);
        expect(res.errors).to.not.exist;
        expect(res.data.payExpense.status).to.equal('PAID');
        balance = await collective.getBalance();
        expect(balance).to.equal(initialBalance - expense.amount);
        await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0, {
          delay: 500,
        });
        expect(emailSendMessageSpy.callCount).to.equal(4);
      });
    });
  }); /* End of #payExpense */

  describe('#editExpense', () => {
    describe('goes back to pending if editing critical fields', () => {
      it('Amount', async () => {
        const expense = await fakeExpense({ status: 'APPROVED', amount: 1000 });
        const newExpenseData = { expense: { id: expense.id, amount: 100 } };
        const result = await utils.graphqlQuery(editExpenseMutation, newExpenseData, expense.User);
        expect(result.errors).to.not.exist;
        expect(result.data.editExpense.status).to.equal('PENDING');
      });

      it('Payout', async () => {
        // With legacy field
        const expense = await fakeExpense({ status: 'APPROVED', legacyPayoutMethod: 'other' });
        await fakePayoutMethod({ type: PayoutMethodTypes.PAYPAL, CollectiveId: expense.FromCollectiveId }); // Add a PayPal PM for this user
        const newExpenseData = { id: expense.id, payoutMethod: 'paypal' };
        const result = await utils.graphqlQuery(editExpenseMutation, { expense: newExpenseData }, expense.User);
        expect(result.errors).to.not.exist;
        expect(result.data.editExpense.status).to.equal('PENDING');

        // With new field
        const expense2 = await fakeExpense({ status: 'APPROVED', legacyPayoutMethod: 'other' });
        const newPayoutMethod = await fakePayoutMethod({ CollectiveId: expense2.User.CollectiveId });
        const newExpense2Data = { id: expense2.id, PayoutMethod: { id: newPayoutMethod.id } };
        const result2 = await utils.graphqlQuery(editExpenseMutation, { expense: newExpense2Data }, expense2.User);
        expect(result2.errors).to.not.exist;
        expect(result2.data.editExpense.status).to.equal('PENDING');
      });

      it('Attachment(s)', async () => {
        const expense = await fakeExpense({ status: 'APPROVED' });
        const newExpenseData = { id: expense.id, attachment: store.randUrl() };
        const result = await utils.graphqlQuery(editExpenseMutation, { expense: newExpenseData }, expense.User);
        expect(result.errors).to.not.exist;
        expect(result.data.editExpense.status).to.equal('PENDING');
      });

      it('Description => should not change status', async () => {
        const expense = await fakeExpense({ status: 'APPROVED' });
        const newExpenseData = { id: expense.id, description: randStr() };
        const result = await utils.graphqlQuery(editExpenseMutation, { expense: newExpenseData }, expense.User);
        expect(result.errors).to.not.exist;
        expect(result.data.editExpense.status).to.equal('APPROVED');
      });
    });

    it('updates an expense using the new "attachments" field', async () => {
      const expense = await fakeExpense({ amount: 1000 });
      const expenseUpdateData = {
        id: expense.id,
        attachments: [
          {
            amount: 800,
            description: 'Burger',
            url: store.randUrl(),
          },
          {
            amount: 200,
            description: 'French Fries',
            url: store.randUrl(),
          },
        ],
      };

      const result = await utils.graphqlQuery(editExpenseMutation, { expense: expenseUpdateData }, expense.User);
      const attachmentsFromAPI = result.data.editExpense.attachments;
      expect(result.data.editExpense.amount).to.equal(1000);
      expect(attachmentsFromAPI.length).to.equal(2);
      expenseUpdateData.attachments.forEach(attachment => {
        const attachmentFromApi = attachmentsFromAPI.find(a => a.description === attachment.description);
        expect(attachmentFromApi).to.exist;
        expect(attachmentFromApi.url).to.equal(attachment.url);
        expect(attachmentFromApi.amount).to.equal(attachment.amount);
      });
    });

    it("fails if attachments amount doesn't match expense", async () => {
      const expense = await fakeExpense({ amount: 1000 });
      const expenseUpdateData = {
        id: expense.id,
        attachments: [
          { amount: 800, url: store.randUrl() },
          { amount: 300, url: store.randUrl() },
        ],
      };

      const result = await utils.graphqlQuery(editExpenseMutation, { expense: expenseUpdateData }, expense.User);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal(
        "The sum of all attachments must be equal to the total expense's amount. Expense's total is 1000, but the total of attachments was 1100.",
      );
    });

    it('updates the attachments', async () => {
      const expense = await fakeExpense({ amount: 10000, attachments: [] });
      const attachments = await Promise.all([
        fakeExpenseAttachment({ ExpenseId: expense.id, amount: 2000 }),
        fakeExpenseAttachment({ ExpenseId: expense.id, amount: 3000 }),
        fakeExpenseAttachment({ ExpenseId: expense.id, amount: 5000 }),
      ]);

      const updatedExpenseData = {
        id: expense.id,
        attachments: [
          pick(attachments[0], ['id', 'url', 'amount']), // Don't change the first one (value=2000)
          { ...pick(attachments[1], ['id', 'url']), amount: 7000 }, // Update amount for the second one
          { amount: 1000, url: store.randUrl() }, // Remove the third one and create another instead
        ],
      };

      const result = await utils.graphqlQuery(editExpenseMutation, { expense: updatedExpenseData }, expense.User);
      const returnedAttachments = result.data.editExpense.attachments;
      const sumAttachments = returnedAttachments.reduce((total, attachment) => total + attachment.amount, 0);
      expect(sumAttachments).to.equal(10000);
      expect(returnedAttachments.find(a => a.id === attachments[0].id)).to.exist;
      expect(returnedAttachments.find(a => a.id === attachments[1].id)).to.exist;
      expect(returnedAttachments.find(a => a.id === attachments[2].id)).to.not.exist;
      expect(returnedAttachments.find(a => a.id === attachments[1].id).amount).to.equal(7000);
    });

    it('Updates the attachments and the expense amount at the same time', async () => {
      const expense = await fakeExpense({ amount: 10000, attachments: [] });
      const attachments = await Promise.all([
        fakeExpenseAttachment({ ExpenseId: expense.id, amount: 2000 }),
        fakeExpenseAttachment({ ExpenseId: expense.id, amount: 3000 }),
        fakeExpenseAttachment({ ExpenseId: expense.id, amount: 5000 }),
      ]);

      const updatedExpenseData = {
        id: expense.id,
        amount: 15000,
        attachments: [
          pick(attachments[0], ['id', 'url', 'amount']), // Don't change the first one (value=2000)
          { ...pick(attachments[1], ['id', 'url']), amount: 7000 }, // Update amount for the second one
          { amount: 6000, url: store.randUrl() }, // Remove the third one and create another instead
        ],
      };

      const result = await utils.graphqlQuery(editExpenseMutation, { expense: updatedExpenseData }, expense.User);
      const returnedAttachments = result.data.editExpense.attachments;
      const sumAttachments = returnedAttachments.reduce((total, attachment) => total + attachment.amount, 0);
      expect(sumAttachments).to.equal(15000);
      expect(returnedAttachments.find(a => a.id === attachments[0].id)).to.exist;
      expect(returnedAttachments.find(a => a.id === attachments[1].id)).to.exist;
      expect(returnedAttachments.find(a => a.id === attachments[2].id)).to.not.exist;
      expect(returnedAttachments.find(a => a.id === attachments[1].id).amount).to.equal(7000);
    });
  }); /* End of "#editExpense" */

  describe('#deleteExpense', () => {
    it('fails if not logged in', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // And given the above collective has one expense
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      // When trying to delete the expense without passing a user
      const result = await utils.graphqlQuery(deleteExpenseQuery, {
        id: expense.id,
      });
      // Then there should be an error
      expect(result.errors).to.exist;
      // And then the error message should be set accordingly.
      expect(result.errors[0].message).to.equal('You need to be logged in to delete an expense');
    }); /* End of "fails if not logged in" */

    it('fails if not logged in as author, admin or host', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // And given the above collective has one expense
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(hostAdmin, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      // And given a completely new user that is unrelated to the
      // above collective and expense.
      const { user } = await store.newUser('some random internet user');
      // When trying to delete the expense passing the user above
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, user);
      // Then there should be an error
      expect(result.errors).to.exist;
      // And then the error message should be set accordingly.
      expect(result.errors[0].message).to.equal("You don't have permission to delete this expense");
    }); /* End of "fails if not logged in as author, admin or host" */

    it('fails if logged in as backer of collective', async () => {
      // Given that we have a collective
      const { collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // And given a user to file an expense
      const { user } = await store.newUser('some random internet user');
      // And given the above collective has one expense (created by the host admin)
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      // And a backer user
      const backer = await models.User.createUserWithCollective({ email: store.randEmail(), name: 'test backer user' });
      await models.Member.create({
        CollectiveId: collective.id,
        MemberCollectiveId: backer.CollectiveId,
        role: 'BACKER',
      });
      // When the above expense is attempted to be deleted by the backer
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, backer);
      // Then there should be an error
      expect(result.errors).to.exist;
      // And then the error message should be set accordingly.
      expect(result.errors[0].message).to.equal("You don't have permission to delete this expense");
    }); /* End of "fails if logged in as backer of collective" */

    it('works if logged in as author', async () => {
      // Given that we have a collective
      const { collective } = await store.newCollectiveWithHost('railsgirlsatl', 'USD', 'USD', 10);
      // And given a user that will file an expense
      const { user } = await store.newUser('an internet user');
      // And given the above collective has one expense (created by the above user)
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      expense.status = 'REJECTED';
      await expense.save();
      // When the above user tries to delete the expense
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, user);
      result.errors && console.log(result.errors);
      // Then there should be no errors
      expect(result.errors).to.not.exist;
      // And then the expense should be deleted from the database
      expect(await models.Expense.findByPk(expense.id)).to.be.null;
    }); /* End of "works if logged in as author" */

    it('fails if expense is not rejected', async () => {
      // Given a collective
      const { collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'USD', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (created by
      // the regular user above)
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });

      // When the admin of the collective tries to delete the expense
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, admin);
      expect(result.errors).to.exist;
      // And then the error message should be set accordingly.
      expect(result.errors[0].message).to.equal('Only rejected expense can be deleted');
    }); /* End of "fails if expense is not rejected" */

    it('works if logged in as admin of collective', async () => {
      // Given a collective
      const { collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'USD', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (created by
      // the regular user above)
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });
      expense.status = 'REJECTED';
      await expense.save();
      // When the admin of the collective tries to delete the expense
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, admin);
      result.errors && console.log(result.errors);
      // Then there should be no errors
      expect(result.errors).to.not.exist;
      // And then the expense should be deleted from the database
      expect(await models.Expense.findByPk(expense.id)).to.be.null;
    }); /* End of "works if logged in as admin of collective" */

    it('works if logged in as admin of host collective', async () => {
      // Given a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('Test Collective', 'USD', 'USD', 10);
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (created by
      // the regular user above)
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'manual',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        amount: 1000,
        description: 'Pizza',
        ...data,
      });

      expense.status = 'REJECTED';
      await expense.save();
      // When the admin of the host collective tries to delete the expense
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, hostAdmin);
      result.errors && console.log(result.errors);
      // Then there should be no errors
      expect(result.errors).to.not.exist;
      // And then the expense should be deleted from the database
      expect(await models.Expense.findByPk(expense.id)).to.be.null;
    }); /* End of "works if logged in as admin of host collective" */
  }); /* End of "#deleteExpense" */

  describe('#markExpenseAsUnpaid', () => {
    it('successfully mark expense as unpaid', async () => {
      // Given that we have a host and a collective
      const { hostAdmin, hostCollective, collective } = await store.newCollectiveWithHost(
        'railsgirlsatl',
        'USD',
        'USD',
        10,
      );

      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expenseAmount = 1500;
      const expense = await store.createExpense(user, {
        attachments: [{ url: store.randUrl(), amount: expenseAmount }],
        amount: expenseAmount,
        description: 'Pizza',
        currency: 'USD',
        legacyPayoutMethod: 'other',
        status: 'PENDING',
        collective: { id: collective.id },
      });
      // And given the expense is approved
      expense.status = 'APPROVED';
      await expense.save();
      // Add then add funds to collective
      const initialBalance = 1500;

      await addFunds(user, hostCollective, collective, initialBalance);
      let balance = await collective.getBalance();
      // Confirm the fund was added
      expect(balance).to.equal(1500);
      // Then expense is paid by host admin
      const res = await utils.graphqlQuery(
        payExpenseQuery,
        {
          id: expense.id,
          paymentProcessorFeeInHostCurrency: 0,
        },
        hostAdmin,
      );
      res.errors && console.log(res.errors);
      expect(res.errors).to.not.exist;
      expect(res.data.payExpense.status).to.equal('PAID');
      // checks that the amountExpense was removed from initalBalance
      balance = await collective.getBalance();
      expect(balance).to.equal(initialBalance - expenseAmount);
      // Then mark the expense as unpaid
      const result = await utils.graphqlQuery(
        markExpenseAsUnpaidQuery,
        {
          id: expense.id,
          processorFeeRefunded: false,
        },
        hostAdmin,
      );
      result.errors && console.log(result.errors);
      expect(result.errors).to.not.exist;
      // The expense you should be back to APPROVED status
      expect(result.data.markExpenseAsUnpaid.status).to.equal('APPROVED');
      balance = await collective.getBalance();
      // The balance should restored baack to initalBalance
      expect(balance).to.equal(initialBalance);
    }); /* End of "successfully mark expense as unpaid" */
  }); /* #markExpenseAsUnpaid */
  describe('#unapproveExpense', () => {
    it('successfully unapprove expense', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.newCollectiveWithHost('rollup', 'USD', 'USD', 10);
      // And given a user that will file an expense
      const { user } = await store.newUser('an internet user');
      await fakePayoutMethod({ type: PayoutMethodTypes.PAYPAL, CollectiveId: user.CollectiveId });
      // And given the above collective has one expense (created by
      // the above user)
      const data = {
        currency: 'USD',
        legacyPayoutMethod: 'paypal',
        privateMessage: 'Private instructions to reimburse this expense',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(user, {
        amount: 1000,
        description: 'Pizza',
        attachments: [{ url: store.randUrl(), amount: 1000 }],
        ...data,
      });
      // approve the expense
      const res = await utils.graphqlQuery(approveExpenseQuery, { id: expense.id }, hostAdmin);
      res.errors && console.log(res.errors);
      expect(res.errors).to.not.exist;
      // expect expense to be first approved
      expect(res.data.approveExpense.status).to.equal('APPROVED');
      // When the expense is approved by the admin of host
      const result = await utils.graphqlQuery(unapproveExpenseQuery, { id: expense.id }, hostAdmin);
      result.errors && console.log(result.errors);
      // Then there should be no errors in the result
      expect(result.errors).to.not.exist;
      // And then the approved expense should be set as PENDING
      expect(result.data.unapproveExpense.status).to.equal('PENDING');
    }); /* End of "successfully unapprove expense" */
  }); /* End of #unapproveExpense */
}); /* End of "GraphQL Expenses API" */
