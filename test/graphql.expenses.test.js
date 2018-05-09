/** @module test/graphql.expenses.test
 *
 * This tests all the GraphQL API methods that interact with
 * expenses. */

/* Test libraries */
import sinon from 'sinon';
import { expect } from 'chai';

/* Test utilities */
import * as utils from './utils';
import * as store from './features/support/stores';

/* Support code */
import models from '../server/models';
import emailLib from '../server/lib/email';

/* Queries used throughout these tests */
const allExpensesQuery = `
  query allExpenses($CollectiveId: Int!, $category: String, $fromCollectiveSlug: String, $limit: Int, $includeHostedCollectives: Boolean) {
    allExpenses(CollectiveId: $CollectiveId, category: $category, fromCollectiveSlug: $fromCollectiveSlug, limit: $limit, includeHostedCollectives: $includeHostedCollectives) {
      id
      description
      amount
      category
      user { id email paypalEmail collective { id slug } }
      collective { id slug } } }`;

const createExpenseQuery = `
  mutation createExpense($expense: ExpenseInputType!) {
    createExpense(expense: $expense) {
      id
      status
      user { id name collective { id name slug } } } }`;

const approveExpenseQuery = `
  mutation approveExpense($id: Int!) {
    approveExpense(id: $id) { id status } }`;

const deleteExpenseQuery = `
  mutation deleteExpense($id: Int!) { deleteExpense(id: $id) { id } }`;

const payExpenseQuery = `
  mutation payExpense($id: Int!, $fee: Int!) {
    payExpense(id: $id, fee: $fee) { id status } }`;

describe('GraphQL Expenses API', () => {

  beforeEach(utils.resetTestDB);

  describe('#allExpenses', () => {

    it('fails if collective not found', async () => {
      // Given we have no collective with id 999999
      // When we try to retrieve expenses from an invalid collective
      const result = await utils.graphqlQuery(allExpensesQuery, { CollectiveId: 999999 });
      // Then we should see an error
      expect(result.errors).to.exist;
      // And then the error message should be appropriate
      expect(result.errors[0].message).to.equal('Collective not found');
    }); /* End of "fails if collective not found" */

    it('gets no expenses if collective has no expenses', async () => {
      // Given that we have a collective with no expenses
      const { collective } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // When we retrieve all its expenses
      const result = await utils.graphqlQuery(allExpensesQuery, { CollectiveId: collective.id });
      result.errors && console.log(result.errors);
      // Then there should be no errors
      expect(result.errors).to.not.exist;
      // And then it should retrieve no expenses
      expect(result.data.allExpenses).to.have.length(0);
    }); /* End of "gets no expenses if collective has no expenses" */

    it('gets the latest expenses from one collective', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // And given the above collective has some expenses
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      await store.createExpense(hostAdmin, { amount: 1000, description: "Pizza", ...data });
      await store.createExpense(hostAdmin, { amount: 2000, description: "Beer", ...data });
      await store.createExpense(hostAdmin, { amount: 3000, description: "Banner", ...data });
      await store.createExpense(hostAdmin, { amount: 4000, description: "Stickers", ...data });
      await store.createExpense(hostAdmin, { amount: 5000, description: "T-shirts", ...data });
      // When we retrieve all its expenses
      const result = await utils.graphqlQuery(allExpensesQuery, { CollectiveId: collective.id, limit: 5 });
      result.errors && console.log(result.errors);
      expect(result.errors).to.not.exist;
      // Then it should retrieve the right amount of expenses
      const expenses = result.data.allExpenses;
      expect(expenses).to.have.length(5);
      // And then the expenses retrieved should come from the same
      // collective
      expect(expenses.map(e => e.collective.slug)).to.deep.equal([
        'railsgirlsatl', 'railsgirlsatl', 'railsgirlsatl', 'railsgirlsatl', 'railsgirlsatl'
      ]);
    }); /* End of "gets the latest expenses from one collective" */

    it('gets the latest expenses from all the hosted collectives', async () => {
      // Given that we have two collectives within a host
      const { hostAdmin, hostCollective, collective } = await store.hostAndCollective('apex', 'USD', 10);
      const anotherCollective = (await store.collectiveWithHost('brusselstogether', hostCollective)).collective;
      // And given that the first collective created above have two expenses
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      await store.createExpense(hostAdmin, { amount: 1000, description: "Pizza", ...data });
      await store.createExpense(hostAdmin, { amount: 2000, description: "Beer", ...data });
      // And given that the second collective created above also have
      // two expenses
      data. collective = { id: anotherCollective.id };
      await store.createExpense(hostAdmin, { amount: 3000, description: "Banner", ...data });
      await store.createExpense(hostAdmin, { amount: 4000, description: "Stickers", ...data });
      // When we retrieve all the expenses of the host
      const result = await utils.graphqlQuery(allExpensesQuery, { CollectiveId: hostCollective.id, limit: 5, includeHostedCollectives: true });
      result.errors && console.log(result.errors);
      // Then there should be no errors in the response
      expect(result.errors).to.not.exist;
      // And then there should be four expenses in total since we're
      // counting the two collectives hosted by `hostCollective`.
      expect(result.data.allExpenses).to.have.length(4);
      expect(result.data.allExpenses.map(e => e.collective.slug))
        .to.deep.equal([ 'brusselstogether', 'brusselstogether', 'apex', 'apex' ]);
    }); /* End of "gets the latest expenses from all the hosted collectives" */

    it('gets the latest expenses from all the hosted collectives for one category', async () => {
      // Given that we have two collectives within a host
      const { hostAdmin, hostCollective, collective } = await store.hostAndCollective('apex', 'USD', 10);
      const anotherCollective = (await store.collectiveWithHost('babel', hostCollective)).collective;
      // And given that the first collective created above have two
      // expenses but just one categorized as `legal`.
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      await store.createExpense(hostAdmin, { amount: 1000, category: 'legal', description: "Pizza", ...data });
      await store.createExpense(hostAdmin, { amount: 2000, category: 'treat', description: "Beer", ...data });
      // And given that the second collective created above also have
      // two expenses but just one categorized as `legal`.
      data. collective = { id: anotherCollective.id };
      await store.createExpense(hostAdmin, { amount: 3000, category: 'legal', description: "Banner", ...data });
      await store.createExpense(hostAdmin, { amount: 4000, category: 'stuff', description: "Stickers", ...data });
      // When we retrieve all the expenses of the host
      const result = await utils.graphqlQuery(allExpensesQuery, {
        category: "legal",
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
      const { hostAdmin, hostCollective, collective } = await store.hostAndCollective('apex', 'USD', 10);
      const anotherCollective = (await store.collectiveWithHost('babel', hostCollective)).collective;
      // And given that the first collective created above have two
      // expenses but just one filed by our user
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      await store.createExpense(xdamman, { amount: 1000, category: 'legal', description: "Pizza", ...data });
      await store.createExpense(hostAdmin, { amount: 2000, category: 'treat', description: "Beer", ...data });
      // And given that the second collective created above also have
      // two expenses but just one filed by our user
      data.collective = { id: anotherCollective.id };
      await store.createExpense(xdamman, { amount: 3000, category: 'legal', description: "Banner", ...data });
      await store.createExpense(hostAdmin, { amount: 4000, category: 'stuff', description: "Stickers", ...data });
      // When we retrieve all the expenses of the host
      const result = await utils.graphqlQuery(allExpensesQuery, {
        fromCollectiveSlug: "xdamman",
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

  describe('#createExpense', () => {

    let sandbox, emailSendMessageSpy;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
    });

    afterEach(() => sandbox.restore());

    it('fails to create an expense if not logged in', async () => {
      // Given a collective
      const { collective } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // When it's attempted to create an expense with no user
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      const result = await utils.graphqlQuery(createExpenseQuery, { expense: data });
      // Then there should be an error
      expect(result.errors).to.exist;
      // And then the error message should be clear
      expect(result.errors[0].message).to.equal('You need to be logged in to create an expense');
    }); /* End of "fails to create an expense if not logged in" */

    it('creates a new expense logged in and send email to collective admin for approval', async () => {
      // Given a collective
      const { collective } = await store.hostAndCollective('Test Collective', 'USD', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // When a new expense is created
      const data = {
        amount: 1000, currency: 'USD', payoutMethod: 'paypal',
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
      const membership = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'CONTRIBUTOR' }});
      expect(membership).to.exist;
      expect(membership.MemberCollectiveId).to.equal(user.CollectiveId);

      // And then an email should have been sent to the admin. This
      // call to the function `waitForCondition()` is required because
      // notifications are sent asynchronously.
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
      expect(emailSendMessageSpy.callCount).to.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(admin.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.equal("New expense on Test Collective: $10 for Test expense for pizza");
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain("/test-collective/expenses/1/approve");

      // XXX: This was just copied over. I don't know what this is
      // actually testing:
      // doesn't scream when adding another expense from same user
      const res = await utils.graphqlQuery(createExpenseQuery, { expense: data }, user);
      expect(res.errors).to.not.exist;
    }); /* End of "creates a new expense logged in and send email to collective admin for approval" */

  }); /* End of "#createExpense" */

  describe('#approveExpense', () => {

    let sandbox, emailSendMessageSpy;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
    });

    afterEach(() => sandbox.restore());

    it("fails to approve expense if expense.status is PAID", async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.hostAndCollective('parcel', 'USD', 10);
      // And given the above collective has some expenses
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      const expense = await store.createExpense(hostAdmin, { amount: 1000, description: "Pizza", ...data });
      // And given that the above expense was already PAID
      await (await models.Expense.findById(expense.id)).update({ status: 'PAID' });
      // When there's an attempt to approve an already paid expense
      const result = await utils.graphqlQuery(approveExpenseQuery, { id: expense.id }, hostAdmin);
      // Then there should be an error
      expect(result.errors).to.exist;
      // And then the error message should be set accordingly
      expect(result.errors[0].message).to.equal("You can't reject an expense that is already paid")
    }); /* End of "fails to approve expense if expense.status is PAID" */

    it("successfully approve expense if expense.status is PENDING and send notification email to author of expense and host admin (unless unsubscribed)", async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.hostAndCollective('rollup', 'USD', 10);
      // And given a user that will file an expense
      const { user } = await store.newUser('an internet user', { paypalEmail: 'testuser@paypal.com' });
      // And given the above collective has one expense (created by
      // the above user)
      const data = {
        currency: 'USD', payoutMethod: 'paypal',
        privateMessage: 'Private instructions to reimburse this expense',
        collective: { id: collective.id },
      };
      const expense = await store.createExpense(user, { amount: 1000, description: "Pizza", ...data });
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
      await utils.waitForCondition(() => emailSendMessageSpy.callCount === 2);
      expect(emailSendMessageSpy.callCount).to.equal(2);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain("Your expense");
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain("has been approved");
      expect(emailSendMessageSpy.secondCall.args[0]).to.equal(hostAdmin.email);
      expect(emailSendMessageSpy.secondCall.args[1]).to.contain("New expense approved on rollup: $10 for Pizza");
      expect(emailSendMessageSpy.secondCall.args[2]).to.contain("PayPal (testuser@paypal.com)");
      expect(emailSendMessageSpy.secondCall.args[2]).to.contain("Private instructions to reimburse this expense");
    }); /* End of "successfully approve expense if expense.status is PENDING and send notification email to author of expense and host admin (unless unsubscribed)" */

  }); /* End of "#approveExpense" */

  describe('#rejectExpense', () => {
  }); /* End of "#rejectExpense" */

  describe('#payExpense', () => {

    let sandbox, emailSendMessageSpy;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
    });

    afterEach(() => sandbox.restore());

    it('fails if expense is not approved (PENDING)', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expense = await store.createExpense(user, {
        amount: 1000,
        description: "Pizza",
        currency: 'USD',
        payoutMethod: 'manual',
        collective: { id: collective.id }
      });
      // When the expense attempted to be paid
      const parameters = { id: expense.id, fee: 0 };
      const result = await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);
      // Then there should be errors
      expect(result.errors).to.exist;
      // And then the message of the error should be set accordingly
      expect(result.errors[0].message).to.equal(
        "Expense needs to be approved. Current status of the expense: PENDING.");
    }); /* End of "fails if expense is not approved (PENDING)" */

    it('fails if expense is not approved (REJECTED)', async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expense = await store.createExpense(user, {
        amount: 1000,
        description: "Pizza",
        currency: 'USD',
        payoutMethod: 'manual',
        collective: { id: collective.id }
      });
      // And the expense is rejected
      await models.Expense.update({ status: 'REJECTED' }, { where: { id: expense.id }});
      // When the expense attempted to be paid
      const parameters = { id: expense.id, fee: 0 };
      const result = await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);
      // Then there should be errors
      expect(result.errors).to.exist;
      // And then the message of the error should be set accordingly
      expect(result.errors[0].message).to.equal(
        "Expense needs to be approved. Current status of the expense: REJECTED.");
    }); /* End of "fails if expense is not approved (REJECTED)" */

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

    it("fails if not enough funds", async () => {
      // Given that we have a host and a collective
      const {
        hostAdmin,
        hostCollective,
        collective
      } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expense = await store.createExpense(user, {
        amount: 1000,
        description: "Pizza",
        currency: 'USD',
        payoutMethod: 'manual',
        collective: { id: collective.id }
      });
      // And given the expense is approved
      expense.status = 'APPROVED';
      expense.payoutMethod = 'paypal';
      await expense.save();
      // And then add funds to the collective
      await addFunds(user, hostCollective, collective, 500);
      // When the expense is paid by the host admin
      const result = await utils.graphqlQuery(payExpenseQuery, { id: expense.id, fee: 0 }, hostAdmin);
      // Then there should be errors
      expect(result.errors).to.exist;
      // And then the error message should be set appropriately
      expect(result.errors[0].message).to.equal(
        "You don't have enough funds to pay this expense. Current balance: $5, Expense amount: $10");
    });

    it("fails if not enough funds to cover the fees", async () => {
      // Given that we have a host and a collective
      const {
        hostCollective,
        hostAdmin,
        collective
      } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expense = await store.createExpense(user, {
        amount: 1000,
        description: "Pizza",
        currency: 'USD',
        payoutMethod: 'manual',
        collective: { id: collective.id }
      });
      // And given the expense is approved
      expense.status = 'APPROVED';
      expense.payoutMethod = 'paypal';
      await expense.save();
      // And then add funds to the collective
      await addFunds(user, hostCollective, collective, 1000);
      // When the expense is paid by the host admin
      const parameters = { id: expense.id, fee: 0 };
      const result = await utils.graphqlQuery(payExpenseQuery, parameters, hostAdmin);
      // Then there should be errors
      expect(result.errors).to.exist;
      // And then the error message should be set appropriately
      expect(result.errors[0].message).to.equal(
        "You don't have enough funds to cover for the fees of this payment method. Current balance: $10, Expense amount: $10, Estimated paypal fees: $1");
    }); /* End of "fails if not enough funds to cover the fees" */

    it("pays the expense manually and reduces the balance of the collective", async () => {
      // Given that we have a host and a collective
      const {
        hostCollective,
        hostAdmin,
        collective
      } = await store.hostAndCollective('Test Collective', 'USD', 10);
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (in PENDING
      // state)
      const expense = await store.createExpense(user, {
        amount: 1000,
        description: "Pizza",
        currency: 'USD',
        payoutMethod: 'manual',
        collective: { id: collective.id }
      });
      // And given the expense is approved
      expense.status = 'APPROVED';
      expense.payoutMethod = 'other';
      await expense.save();
      // And then add funds to the collective
      await addFunds(user, hostCollective, collective, 1500);
      // When the expense is paid by the host admin
      let balance = await collective.getBalance();
      expect(balance).to.equal(1500);
      const res = await utils.graphqlQuery(payExpenseQuery, { id: expense.id, fee: 100 }, hostAdmin);
      res.errors && console.log(res.errors);
      expect(res.errors).to.not.exist;
      expect(res.data.payExpense.status).to.equal('PAID');
      balance = await collective.getBalance();
      expect(balance).to.equal(500);
      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0, { delay: 500 });
      expect(emailSendMessageSpy.callCount).to.equal(2);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user.email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.contain("Your $10 expense submitted to Test Collective has been paid");
      expect(emailSendMessageSpy.secondCall.args[0]).to.equal(hostAdmin.email);
      expect(emailSendMessageSpy.secondCall.args[1]).to.contain("Expense paid on Test Collective");
    }); /* End of "pays the expense manually and reduces the balance of the collective" */

  }); /* End of #payExpense */

  describe('#editExpense', () => {
  }); /* End of "#editExpense" */

  describe('#deleteExpense', () => {
    it("fails if not logged in", async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // And given the above collective has one expense
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      const expense = await store.createExpense(hostAdmin, { amount: 1000, description: "Pizza", ...data });
      // When trying to delete the expense without passing a user
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id });
      // Then there should be an error
      expect(result.errors).to.exist;
      // And then the error message should be set accordingly.
      expect(result.errors[0].message).to.equal("You need to be logged in to delete an expense");
    }); /* End of "fails if not logged in" */

    it("fails if not logged in as author, admin or host", async () => {
      // Given that we have a collective
      const { hostAdmin, collective } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // And given the above collective has one expense
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      const expense = await store.createExpense(hostAdmin, { amount: 1000, description: "Pizza", ...data });
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

    it("fails if logged in as backer of collective", async () => {
      // Given that we have a collective
      const { collective } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // And given a user to file an expense
      const { user } = await store.newUser('some random internet user');
      // And given the above collective has one expense (created by the host admin)
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      const expense = await store.createExpense(user, { amount: 1000, description: "Pizza", ...data });
      // And a backer user
      const backer = await models.User.createUserWithCollective({ name: "test backer user" });
      await models.Member.create({ CollectiveId: collective.id, MemberCollectiveId: backer.CollectiveId, role: "BACKER" });
      // When the above expense is attempted to be deleted by the backer
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, backer);
      // Then there should be an error
      expect(result.errors).to.exist;
      // And then the error message should be set accordingly.
      expect(result.errors[0].message).to.equal("You don't have permission to delete this expense");
    }); /* End of "fails if logged in as backer of collective" */

    it("works if logged in as author", async () => {
      // Given that we have a collective
      const { collective } = await store.hostAndCollective('railsgirlsatl', 'USD', 10);
      // And given a user that will file an expense
      const { user } = await store.newUser('an internet user');
      // And given the above collective has one expense (created by the above user)
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      const expense = await store.createExpense(user, { amount: 1000, description: "Pizza", ...data });
      // When the above user tries to delete the expense
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, user);
      result.errors && console.log(result.errors);
      // Then there should be no errors
      expect(result.errors).to.not.exist;
      // And then the expense should be deleted from the database
      expect(await models.Expense.findById(expense.id)).to.be.null;
    }); /* End of "works if logged in as author" */

    it("works if logged in as admin of collective", async () => {
      // Given a collective
      const { collective } = await store.hostAndCollective('Test Collective', 'USD', 10);
      // And given an admin for the above collective
      const admin = (await store.newUser('collectives-admin')).user;
      await collective.addUserWithRole(admin, 'ADMIN');
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (created by
      // the regular user above)
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      const expense = await store.createExpense(user, { amount: 1000, description: "Pizza", ...data });
      // When the admin of the collective tries to delete the expense
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, admin);
      result.errors && console.log(result.errors);
      // Then there should be no errors
      expect(result.errors).to.not.exist;
      // And then the expense should be deleted from the database
      expect(await models.Expense.findById(expense.id)).to.be.null;
    }); /* End of "works if logged in as admin of collective" */

    it("works if logged in as admin of host collective", async () => {
      // Given a collective
      const { hostAdmin, collective } = await store.hostAndCollective('Test Collective', 'USD', 10);
      // And given a user to file expenses
      const { user } = await store.newUser('someone cool');
      // And given the above collective has one expense (created by
      // the regular user above)
      const data = { currency: 'USD', payoutMethod: 'manual', collective: { id: collective.id } };
      const expense = await store.createExpense(user, { amount: 1000, description: "Pizza", ...data });
      // When the admin of the host collective tries to delete the expense
      const result = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, hostAdmin);
      result.errors && console.log(result.errors);
      // Then there should be no errors
      expect(result.errors).to.not.exist;
      // And then the expense should be deleted from the database
      expect(await models.Expense.findById(expense.id)).to.be.null;
    }); /* End of "works if logged in as admin of host collective" */

  }); /* End of "#deleteExpense" */

}); /* End of "GraphQL Expenses API" */
