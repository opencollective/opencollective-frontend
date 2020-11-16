import { randomSlug } from '../support/faker';

describe('host dashboard', () => {
  before(() => {
    cy.signup({ redirect: '/brusselstogetherasbl' });
  });

  it('mark pending application approved', () => {
    const collectiveSlug = randomSlug();

    cy.get('[data-cy="host-apply-btn"]:not([disabled]):visible', { timeout: 30000 }).click();
    cy.get(`input[name="name"]`).type('Cavies United');
    cy.get(`input[name="slug"]`).type(`{selectall}${collectiveSlug}`);
    cy.get(`input[name="description"]`).type('We will rule the world with our cute squeaks');
    // FIXME: more precise selector such as
    // cy.get('input[name="tos"] [data-cy="custom-checkbox"]').click();
    cy.get('[data-cy="custom-checkbox"]').click();
    cy.wait(300);
    cy.get('button[type="submit"]').click();
    cy.contains('The Cavies United Collective has been created!');
    cy.login({ redirect: '/brusselstogetherasbl/dashboard' });
    cy.get('[data-cy="host-dashboard-menu-bar"]').contains('Pending applications').click();
    cy.get(`[data-cy="${collectiveSlug}-approve"]`).click();
    cy.contains(`[data-cy="host-application"]`, 'Approved');
  });

  it('mark pending order as paid', () => {
    cy.login({ redirect: '/brusselstogetherasbl/dashboard/donations' });
    cy.get('.Orders .item:first .status').contains('pending');
    cy.get('.MarkOrderAsPaidBtn button').first().click();
    cy.get('.Orders .item:first .status').contains('paid');
    cy.wait(1000);
  });

  describe('legacy expense tab', () => {
    it('approve expense and reject expense', () => {
      cy.login({ redirect: '/brusselstogetherasbl/dashboard/expenses-legacy' });
      cy.get('[data-cy="expense-paid"]').as('currentExpense');
      cy.get('[data-cy="expense-actions"]').contains('button', 'Unapprove').click();
      cy.get('[data-cy="confirmation-modal-continue"]').click();
      cy.wait(500);
      cy.get('[data-cy="reject-expense-btn"]').within(() => {
        cy.get('button').click();
      });
      cy.get('[data-cy="approve-expense-btn"]').within(() => {
        cy.get('button').click();
      });
    });

    it('record expense as paid', () => {
      cy.login({ redirect: '/brusselstogetherasbl/dashboard/expenses-legacy' });
      cy.get('[data-cy="expense-approved"]').as('currentExpense');
      cy.get('[data-cy="expense-actions"]').contains('button', 'Record as paid').click();
      cy.get('@currentExpense').should('have.attr', 'data-cy', 'expense-paid');
    });

    it('mark expense as unpaid', () => {
      cy.login({ redirect: '/brusselstogetherasbl/dashboard/expenses-legacy' });
      cy.get('[data-cy="expense-paid"]').as('currentExpense');
      cy.get('[data-cy="expense-actions"]').as('currentExpenseActions').contains('button', 'Mark as unpaid').click();
      cy.get('@currentExpenseActions').contains('button', 'Continue').click();
      cy.get('@currentExpense').should('have.attr', 'data-cy', 'expense-approved');
    });

    it('delete rejected expense', () => {
      cy.login({ redirect: '/brusselstogetherasbl/dashboard/expenses-legacy' });
      cy.get('[data-cy="expense-rejected"]').as('currentExpense');
      cy.get('[data-cy="expense-actions"]').contains('button', 'Delete').click();
      cy.get('[data-cy="confirmation-modal-continue"]').click();
      cy.get('[data-cy="errorMessage"]').should('not.exist');
    });
  });
});
