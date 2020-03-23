describe('collective page', () => {
  before(() => {
    cy.visit('/apex/legacy');
  });

  it('loads the collective page', () => {
    cy.wait(100);
    cy.get('#contribute .TierCard').should('have.length', 2);
    cy.get('#contributors .CollectiveCard').first().find('.totalDonations').contains('$1,700');
    cy.get('[data-cy=subtitle]').contains('Current balance: $4.71');
    cy.get('#contributors .Members.cardsList .Member').should('have.length', 26);
  });

  it('loads the latest expenses', () => {
    cy.get('#expenses .itemsList .expense').should('have.length', 5);
  });

  it('opens all expenses page', () => {
    cy.get('#expenses .ViewAllExpensesBtn a').click();
    cy.wait(300);
    cy.get('.ExpensesPage .ExpensesStats').contains('Available balance');
    cy.get('.ExpensesPage .ExpensesStats').contains('Engineering ($3,808)');
    cy.get('.ExpensesPage .ExpensesStats').contains('TJ Holowaychuk ($3,391)');
    cy.get('.ExpensesPage .itemsList .expense').should('have.length', 6);
  });

  it('opens new expense page', () => {
    cy.get('[data-cy="submit-expense-btn"]').click();
    cy.wait(500);
    cy.get('.ExpensesPage .CreateExpenseForm').contains('Sign up or login to submit an expense');
  });
});
