import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';
import emailLib from '../server/lib/email';
import sinon from 'sinon';

import * as utils from './utils';

describe('graphql.collective.test.js', () => {
  let host, collective;

  describe("read", () => {

    before(() => utils.loadDB('opencollective_dvl'));
    before(() => models.Collective.findOne({ where: { slug: 'opensourceorg' }}).then(c => host = c));
    before(() => models.Collective.findOne({ where: { slug: 'railsgirlsatl' }}).then(c => collective = c));

    const query = `
    query allExpenses($CollectiveId: Int!, $category: String, $fromCollectiveSlug: String, $limit: Int, $includeHostedCollectives: Boolean) {
      allExpenses(CollectiveId: $CollectiveId, category: $category, fromCollectiveSlug: $fromCollectiveSlug, limit: $limit, includeHostedCollectives: $includeHostedCollectives) {
        id
        description
        amount
        category
        user {
          id
          email
          paypalEmail
          collective {
            id
            slug
          }
        }
        collective {
          id
          slug
        }
      }
    }`;

    it('fails if collective not found', async () => {
      const result = await utils.graphqlQuery(query, { CollectiveId: 999999 });
      result.errors && console.error(result.errors);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('Collective not found');
    })

    it('gets the latest expenses from one collective', async () => {
      const result = await utils.graphqlQuery(query, { CollectiveId: collective.id, limit: 5 });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const expenses = result.data.allExpenses;
      expect(expenses).to.have.length(5);
      expect(expenses.map(e => e.collective.slug)).to.deep.equal([ 'railsgirlsatl', 'railsgirlsatl', 'railsgirlsatl', 'railsgirlsatl', 'railsgirlsatl' ]);
    });

    it('gets the latest expenses from all the hosted collectives', async () => {
      const result = await utils.graphqlQuery(query, { CollectiveId: host.id, limit: 5, includeHostedCollectives: true });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const expenses = result.data.allExpenses;
      expect(expenses).to.have.length(5);
      expect(expenses.map(e => e.collective.slug)).to.deep.equal([ 'apex', 'opensource', 'opensource', 'opensource', 'apex' ]);
    });

    it('gets the latest expenses from all the hosted collectives for one category', async () => {
      const result = await utils.graphqlQuery(query, { category: "legal", CollectiveId: host.id, limit: 5, includeHostedCollectives: true });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const expenses = result.data.allExpenses;
      expect(expenses).to.have.length(5);
      expect(expenses.map(e => e.category)).to.deep.equal([ 'Legal', 'Legal', 'Legal', 'Legal', 'Legal' ]);
    });

    it('gets the latest expenses from all the hosted collectives for one author', async () => {
      const result = await utils.graphqlQuery(query, { fromCollectiveSlug: "xdamman", CollectiveId: host.id, limit: 5, includeHostedCollectives: true });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const expenses = result.data.allExpenses;
      expect(expenses).to.have.length(5);
      expect(expenses.map(e => e.user.collective.slug)).to.deep.equal([ 'xdamman', 'xdamman', 'xdamman', 'xdamman', 'xdamman' ]);
    });
  });

  describe("write", () => {
    let hostCollective, hostAdmin, user, collective, expense;
    let sandbox, emailSendMessageSpy;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
    })
    afterEach(() => sandbox.restore());

    beforeEach(() => utils.resetTestDB());
    beforeEach('create test user', () => models.User.createUserWithCollective({ name: "Test User", email: "testuser@opencollective.com", paypalEmail: "testuser@paypal.com" }).then(u => user = u));
    beforeEach('create test host admin user', () => models.User.createUserWithCollective({ name: "Test Host Admin User", email: "host.admin@opencollective.com" }).then(u => hostAdmin = u));
    beforeEach('create test host org', () => models.Collective.create({ name: "Test Host Org", type: "ORGANIZATION" }).then(c => hostCollective = c));
    beforeEach('create test collective', () => models.Collective.create({ name: "Test Collective", HostCollectiveId: hostCollective.id }).then(c => collective = c));
    beforeEach('add user admin role', () => collective.addUserWithRole(user, 'ADMIN'));
    beforeEach('add host admin role', () => hostCollective.addUserWithRole(hostAdmin, 'ADMIN'));
    beforeEach('create expense', () => models.Expense.create({
      CollectiveId: collective.id,
      UserId: user.id,
      amount: 1000,
      currency: 'USD',
      description: "Test expense for pizza",
      privateMessage: "Private instructions to reimburse this expense",
      attachment: "https://opencollective-production.s3-us-west-1.amazonaws.com/imagejpg_969a1f70-9d47-11e5-80cb-dba89a9a10b0.jpg",
      payoutMethod: 'paypal',
      incurredAt: new Date,
      lastEditedById: user.id,
      status: 'PENDING'
    }).then(e => expense = e))

    const createExpenseQuery = `mutation createExpense($expense: ExpenseInputType!) {
      createExpense(expense: $expense) {
        id
        status
        user {
          id
          name
          collective {
            id
            name
            slug
          }
        }
      }
    }`;

    const deleteExpenseQuery = `
    mutation deleteExpense($id: Int!) {
      deleteExpense(id: $id) {
        id
      }
    }
    `;

    const newExpenseData = {
      amount: 1000,
      currency: 'USD',
      description: "Test expense for pizza",
      payoutMethod: 'manual'
    };

    it("fails to create an expense if not logged in", async () => {
      newExpenseData.collective = { id: collective.id };
      const res = await utils.graphqlQuery(createExpenseQuery, { expense: newExpenseData });
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal('You need to be logged in to create an expense');
    })

    it("creates a new expense logged in and send email to collective admin for approval", async () => {
      newExpenseData.collective = { id: collective.id };
      let res;
      res = await utils.graphqlQuery(createExpenseQuery, { expense: newExpenseData }, user);
      res.errors && console.error(res.errors[0].message);
      expect(res.errors).to.not.exist;
      const expense = res.data.createExpense;
      expect(expense.status).to.equal('PENDING');
      expect(expense.user.id).to.equal(user.id);

      const membership = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'CONTRIBUTOR' }});
      expect(membership).to.exist;
      expect(membership.MemberCollectiveId).to.equal(user.CollectiveId);

      await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
      expect(emailSendMessageSpy.callCount).to.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal("testuser@opencollective.com");
      expect(emailSendMessageSpy.firstCall.args[1]).to.equal("New expense on Test Collective: $10 for Test expense for pizza");
      expect(emailSendMessageSpy.firstCall.args[2]).to.contain("/test-collective/expenses/2/approve");

      // doesn't scream when adding another expense from same user
      res = await utils.graphqlQuery(createExpenseQuery, { expense: newExpenseData }, user);
      res.errors && console.error(res.errors[0].message);
      expect(res.errors).to.not.exist;
    })

    describe("delete an expense", () => {
      it("fails if not logged in", async () => {
        const res = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id });
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal("You need to be logged in to delete an expense");
      });

      it("fails if not logged in as author, admin or host", async () => {
        const user2 = await models.User.createUserWithCollective({ name: "test user 2"});
        const res = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, user2);
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal("You don't have permission to delete this expense");
      });

      it("fails if logged in as backer of collective", async () => {
        const backer = await models.User.createUserWithCollective({ name: "test backer user"});
        await models.Member.create({
          CollectiveId: collective.id,
          MemberCollectiveId: backer.CollectiveId,
          role: "BACKER"
        });
        const res = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, backer);
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal("You don't have permission to delete this expense");
      });

      it("works if logged in as author", async () => {
        const res = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, user);
        expect(res.errors).to.not.exist;
        const deletedExpense = await models.Expense.findById(expense.id);
        expect(deletedExpense).to.be.null;
      });

      it("works if logged in as admin of collective", async () => {
        const admin = await models.User.createUserWithCollective({ name: "test admin user"});
        await models.Member.create({
          CollectiveId: collective.id,
          MemberCollectiveId: admin.CollectiveId,
          role: "ADMIN"
        });
        const res = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, admin);
        expect(res.errors).to.not.exist;
        const deletedExpense = await models.Expense.findById(expense.id);
        expect(deletedExpense).to.be.null;
      });

      it("works if logged in as admin of host collective", async () => {
        const res = await utils.graphqlQuery(deleteExpenseQuery, { id: expense.id }, hostAdmin);
        expect(res.errors).to.not.exist;
        const deletedExpense = await models.Expense.findById(expense.id);
        expect(deletedExpense).to.be.null;
      });
    });

    describe("update status of an expense", () => {

      const approveExpenseQuery = `
        mutation approveExpense($id: Int!) {
          approveExpense(id: $id) {
            id
            status
          }
        }
      `;

      it("fails to approve expense if expense.status is PAID", async () => {
        expense.status = 'PAID';
        await expense.save();
        const res = await utils.graphqlQuery(approveExpenseQuery, { id: expense.id }, hostAdmin);
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal("You can't reject an expense that is already paid")
      });

      it("successfully approve expense if expense.status is PENDING and send notification email to author of expense and host admin (unless unsubscribed)", async () => {

        const hostAdmin2 = await models.User.createUserWithCollective({ name: "Another host admin", email: "host.admin2@opencollective.com"});
        await hostCollective.addUserWithRole(hostAdmin2, 'ADMIN');
        await models.Notification.create({
          UserId: hostAdmin2.id,
          CollectiveId: hostCollective.id,
          channel: "email",
          active: false,
          type: "collective.expense.approved"
        });
        expense.status = 'PENDING';
        await expense.save();
        const res = await utils.graphqlQuery(approveExpenseQuery, { id: expense.id }, hostAdmin);
        expect(res.errors).to.not.exist;
        expect(res.data.approveExpense.status).to.equal('APPROVED');
        await utils.waitForCondition(() => emailSendMessageSpy.callCount === 2);
        expect(emailSendMessageSpy.callCount).to.equal(2);
        expect(emailSendMessageSpy.firstCall.args[0]).to.equal("testuser@opencollective.com");
        expect(emailSendMessageSpy.firstCall.args[1]).to.contain("Your expense");
        expect(emailSendMessageSpy.firstCall.args[1]).to.contain("has been approved");
        expect(emailSendMessageSpy.secondCall.args[0]).to.equal("host.admin@opencollective.com");
        expect(emailSendMessageSpy.secondCall.args[1]).to.contain("New expense approved on Test Collective: $10 for Test expense for pizza");
        expect(emailSendMessageSpy.secondCall.args[2]).to.contain("PayPal (testuser@paypal.com)");
        expect(emailSendMessageSpy.secondCall.args[2]).to.contain("Private instructions to reimburse this expense");
      });

    });

    describe("pay an expense", () => {

      const payExpenseQuery = `
        mutation payExpense($id: Int!) {
          payExpense(id: $id) {
            id
            status
          }
        }
      `;

      const addFunds = async (amount) => {
        await models.Transaction.create({
          CreatedByUserId: user.id,
          HostCollectiveId: hostCollective.id,
          type: 'CREDIT',
          netAmountInCollectiveCurrency: amount,
          currency: 'USD',
          CollectiveId: collective.id
        });
      }

      it("fails if expense is not approved", async () => {
        let res;
        expense.status = 'PENDING';
        await expense.save();
        res = await utils.graphqlQuery(payExpenseQuery, { id: expense.id }, hostAdmin);
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal("Expense needs to be approved. Current status of the expense: PENDING.");

        expense.status = 'REJECTED';
        await expense.save();
        res = await utils.graphqlQuery(payExpenseQuery, { id: expense.id }, hostAdmin);
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal("Expense needs to be approved. Current status of the expense: REJECTED.");
      });

      it("fails if not enough funds", async () => {
        // approve expense
        expense.status = 'APPROVED';
        expense.payoutMethod = 'paypal';
        await expense.save();

        // add funds to the collective
        await addFunds(500);
        const res = await utils.graphqlQuery(payExpenseQuery, { id: expense.id }, hostAdmin);
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal("You don't have enough funds to pay this expense. Current balance: $5, Expense amount: $10");
      });

      it("fails if not enough funds to cover the fees", async () => {
        // approve expense
        expense.status = 'APPROVED';
        expense.payoutMethod = 'paypal';
        await expense.save();

        // add funds to the collective
        await addFunds(1000);
        const res = await utils.graphqlQuery(payExpenseQuery, { id: expense.id }, hostAdmin);
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal("You don't have enough funds to cover for the fees of this payment method. Current balance: $10, Expense amount: $10, Estimated paypal fees: $1");
      });

      it("pays the expense manually and reduces the balance of the collective", async () => {
        // approve expense
        expense.status = 'APPROVED';
        expense.payoutMethod = 'other';
        await expense.save();

        let balance;
        // add funds to the collective
        await addFunds(1500);
        balance = await collective.getBalance();
        expect(balance).to.equal(1500);
        const res = await utils.graphqlQuery(payExpenseQuery, { id: expense.id }, hostAdmin);
        expect(res.errors).to.not.exist;
        expect(res.data.payExpense.status).to.equal('PAID');
        balance = await collective.getBalance();
        expect(balance).to.equal(500);
        await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0, { delay: 500 });
        expect(emailSendMessageSpy.callCount).to.equal(2);
        expect(emailSendMessageSpy.firstCall.args[0]).to.equal("testuser@opencollective.com");
        expect(emailSendMessageSpy.firstCall.args[1]).to.contain("Your $10 expense submitted to Test Collective has been paid");
        expect(emailSendMessageSpy.secondCall.args[0]).to.equal("host.admin@opencollective.com");
        expect(emailSendMessageSpy.secondCall.args[1]).to.contain("Expense paid on Test Collective");
      });
    })
  });
});
