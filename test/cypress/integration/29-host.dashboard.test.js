import { randomSlug } from '../support/faker';

const hasNewNavbar = Cypress.env('NEW_COLLECTIVE_NAVBAR');

describe('host dashboard', () => {
  before(() => {
    cy.signup({ redirect: '/brusselstogetherasbl' });
  });

  describe('pending applications', () => {
    it('mark pending application approved', () => {
      const collectiveSlug = randomSlug();

      if (hasNewNavbar) {
        cy.getByDataCy('collective-navbar-actions-btn').click();
        cy.getByDataCy('host-apply-btn').click({ force: true });
      } else {
        cy.get('[data-cy="host-apply-btn"]:visible').click();
      }

      cy.getByDataCy('host-apply-collective-picker').click();
      cy.getByDataCy('host-apply-new-collective-link').click();
      cy.get(`input[name="name"]`).type('Cavies United');
      cy.get(`input[name="slug"]`).type(`{selectall}${collectiveSlug}`);
      cy.get(`input[name="description"]`).type('We will rule the world with our cute squeaks');
      cy.getByDataCy('checkbox-tos').click();
      cy.wait(300);
      cy.get('button[type="submit"]').click();
      cy.contains('The Cavies United Collective has been created!');
      cy.login({ redirect: '/brusselstogetherasbl/dashboard' });
      cy.get('[data-cy="host-dashboard-menu-bar"]').contains('Pending applications').click();
      cy.get(`[data-cy="${collectiveSlug}-approve"]`).click();
      cy.contains(`[data-cy="host-application"]`, 'Approved');
    });
  });

  describe('Orders', () => {
    it('mark pending order as paid', () => {
      cy.login({ redirect: '/brusselstogetherasbl/dashboard/donations' });
      cy.get('[data-cy="MARK_AS_PAID-button"]:first').click();
      cy.getByDataCy('confirmation-modal-continue').click();
      cy.contains('[data-cy="order-status-msg"]:first', 'Paid');
    });
  });

  describe('expenses tab', () => {
    let expense;

    before(() => {
      // 207 - BrusselsTogether
      cy.createExpense({ collective: { id: 207 } }).then(e => (expense = e));
    });

    it('Process expense', () => {
      cy.login({ redirect: '/brusselstogetherasbl/dashboard/expenses' });
      cy.getByDataCy(`expense-container-${expense.id}`).as('currentExpense');

      // Defaults to pending, approve it
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Pending');
      cy.get('@currentExpense').find('[data-cy="approve-button"]').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Approved');

      // Unapprove
      cy.get('@currentExpense').find('[data-cy="unapprove-button"]').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Pending');

      // Approve
      cy.get('@currentExpense').find('[data-cy="approve-button"]').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Approved');

      // Pay
      cy.get('@currentExpense').find('[data-cy="pay-button"]').click();
      cy.getByDataCy('pay-expense-modal').as('payExpenseModal');
      cy.get('@payExpenseModal').find('[data-cy="pay-type-MANUAL"]').click();
      cy.get('@payExpenseModal').find('[data-cy="mark-as-paid-button"]').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Paid');

      // Mark as unpaid
      cy.get('@currentExpense').find('[data-cy="mark-as-unpaid-button"]').click();
      cy.getByDataCy('mark-expense-as-unpaid-modal').as('markAsUnpaidModal');
      cy.get('@markAsUnpaidModal').find('[data-cy="confirmation-modal-continue"]').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Approved');

      // Unapprove
      cy.get('@currentExpense').find('[data-cy="unapprove-button"]').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Pending');

      // Reject
      cy.get('@currentExpense').find('[data-cy="reject-button"]').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Rejected');
    });
  });
});
