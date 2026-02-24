describe('Expense flow', () => {
  describe('new expense when logged out', () => {
    it('shows the login screen', () => {
      cy.createHostedCollective().then(collective => {
        cy.visit(`/${collective.slug}/expenses/new`);
        cy.getByDataCy('signIn-form');
      });
    });
  });

  describe('Actions on expense', () => {
    let collective;
    let user;
    let expense;
    let expenseUrl;

    before(() => {
      cy.signup().then(response => (user = response));
    });

    before(() => {
      cy.createHostedCollective({ userEmail: user.email }).then(c => (collective = c));
    });

    beforeEach(() => {
      cy.createExpense({
        type: 'INVOICE',
        userEmail: user.email,
        account: { legacyId: collective.id },
        payee: { legacyId: user.CollectiveId },
        description: 'Expense for E2E tests',
      }).then(createdExpense => {
        expense = createdExpense;
        expenseUrl = `/${collective.slug}/expenses/${expense.legacyId}`;
      });
    });

    it('Downloads PDF', () => {
      cy.login({ email: user.email, redirect: expenseUrl });
      cy.getByDataCy('download-expense-invoice-btn').click({ force: true });
      const date = new Date(expense.createdAt).toISOString().split('T')[0];
      const filename = `Expense-${expense.legacyId}-${collective.slug}-invoice-${date}.pdf`;
      cy.getDownloadedPDFContent(filename)
        .should('contain', `Expense #${expense.legacyId}: Expense for E2E tests`)
        .should('contain', 'Collective: Test Collective')
        .should('contain', '$10.00');
    });

    it('Approve, unapprove, reject and pay actions on expense', () => {
      cy.login({ email: user.email, redirect: expenseUrl });
      cy.get('[data-cy="expense-status-msg"]').contains('Pending');
      cy.getByDataCy('approve-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Approved');
      cy.getByDataCy('unapprove-button').click();
      cy.getByDataCy('confirm-action-text').type('Unapproved once');
      cy.getByDataCy('confirm-action-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Pending');
      cy.getByDataCy('comment-body').contains('Unapproved once').should('exist');
      cy.getByDataCy('approve-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Approved');
      cy.getByDataCy('unapprove-button').click();
      cy.getByDataCy('confirm-action-text').type('Unapproved twice');
      cy.getByDataCy('confirm-action-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Pending');
      cy.getByDataCy('comment-body').contains('Unapproved twice').should('exist');
      cy.getByDataCy('reject-button').click();
      cy.getByDataCy('confirm-action-text').type('Rejected once');
      cy.getByDataCy('confirm-action-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Rejected');
      cy.getByDataCy('comment-body').contains('Rejected once').should('exist');
    });

    it('Delete expense', () => {
      cy.login({ email: user.email, redirect: expenseUrl });
      cy.getByDataCy('reject-button').click();
      cy.getByDataCy('confirm-action-text').type('rejected!');
      cy.getByDataCy('confirm-action-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Rejected');

      // Now delete the expense
      cy.getByDataCy('more-actions').click();
      cy.getByDataCy('more-actions-delete-expense-btn').click({ force: true });
      cy.getByDataCy('confirmation-modal-continue').click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/${collective.slug}/expenses`);
      cy.visit(expenseUrl);
      cy.getByDataCy('error-page').contains('Page not found');
    });

    it('Displays expense policy', () => {
      cy.login({ email: user.email, redirect: expenseUrl });
      cy.get('[data-cy="go-to-dashboard-btn"]').click();
      cy.getByDataCy('menu-item-Settings').click();
      cy.getByDataCy('menu-item-policies').should('be.visible').click();
      cy.getByDataCy('invoice-expense-policy-input').click().type('this is my test expense policy');
      cy.getByDataCy('receipt-expense-policy-input').click().type('this is my test expense policy');
      cy.getByDataCy('submit-policy-btn').click();
      cy.checkToast({ variant: 'success', message: 'Policies updated successfully' });
      cy.visit(expenseUrl);
      cy.get('[data-cy="submit-expense-dropdown"]:visible:first').click();
      cy.getByDataCy('expense-policy-html').contains('this is my test expense policy');
    });

    it('Projects inherit and display expense policy from parent collective', () => {
      cy.login({ email: user.email, redirect: `/dashboard/${collective.slug}/policies` });
      cy.getByDataCy('invoice-expense-policy-input').click().type('this is my test expense policy');
      cy.getByDataCy('receipt-expense-policy-input').click().type('this is my test expense policy');
      cy.getByDataCy('submit-policy-btn').click();
      cy.checkToast({ variant: 'success', message: 'Policies updated successfully' });
      cy.createProject({ userEmail: user.email, collective }).then(project => {
        cy.visit(`/${project.slug}/expenses/new`);
        cy.getByDataCy('expense-policy-html').contains('this is my test expense policy');
      });
    });
  });
});
