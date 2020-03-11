describe('host dashboard', () => {
  before(() => {
    cy.signup({ redirect: '/brusselstogetherasbl' });
  });

  it('mark pending application approved', () => {
    cy.get('[data-cy="host-apply-btn"]:not([disabled]):visible', { timeout: 30000 }).click();
    cy.fillInputField('name', 'Cavies United', { timeout: 30000 });
    cy.fillInputField('description', 'We will rule the world with our cute squeaks');
    cy.fillInputField('website', 'https://guineapi.gs');
    cy.get('.tos input[type="checkbox"]').click();
    cy.wait(300);
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.url().then(currentUrl => {
      // positive lookbehind regex to get the collective slug from the url
      const CollectiveSlug = currentUrl.match(/(?<=CollectiveSlug=)([A-z-]+)/)[0];
      cy.login({ redirect: '/brusselstogetherasbl/dashboard' });
      cy.get('[data-cy="host-dashboard-menu-bar"]')
        .contains('Pending applications')
        .click();
      cy.get(`[data-cy="${CollectiveSlug}-approve"]`).click();
      cy.get(`[data-cy="${CollectiveSlug}-approved"]`).should('have.attr', 'color', 'green.700');
    });
  });

  it('mark pending order as paid', () => {
    cy.login({ redirect: '/brusselstogetherasbl/dashboard/donations' });
    cy.get('.Orders .item:first .status').contains('pending');
    cy.get('.MarkOrderAsPaidBtn button')
      .first()
      .click();
    cy.get('.Orders .item:first .status').contains('paid');
    cy.wait(1000);
  });

  it('approve expense and reject expense', () => {
    cy.login({ redirect: '/brusselstogetherasbl/dashboard/expenses' });
    cy.get('[data-cy="expense-paid"]').as('currentExpense');
    cy.get('[data-cy="expense-actions"]')
      .contains('button', 'Unapprove')
      .click();
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
    cy.login({ redirect: '/brusselstogetherasbl/dashboard' });
    cy.get('[data-cy="expense-approved"]').as('currentExpense');
    cy.get('[data-cy="expense-actions"]')
      .contains('button', 'Record as paid')
      .click();
    cy.get('@currentExpense').should('have.attr', 'data-cy', 'expense-paid');
  });

  it('mark expense as unpaid', () => {
    cy.login({ redirect: '/brusselstogetherasbl/dashboard' });
    cy.get('[data-cy="expense-paid"]').as('currentExpense');
    cy.get('[data-cy="expense-actions"]')
      .as('currentExpenseActions')
      .contains('button', 'Mark as unpaid')
      .click();
    cy.get('@currentExpenseActions')
      .contains('button', 'Continue')
      .click();
    cy.get('@currentExpense').should('have.attr', 'data-cy', 'expense-approved');
  });

  it('delete rejected expense', () => {
    cy.login({ redirect: '/brusselstogetherasbl/dashboard' });
    cy.get('[data-cy="expense-rejected"]').as('currentExpense');
    cy.get('[data-cy="expense-actions"]')
      .contains('button', 'Delete')
      .click();
    cy.get('[data-cy="confirmation-modal-continue"]').click();
    cy.get('[data-cy="errorMessage"]').should('not.exist');
  });
});
