describe('expenses.page.test.js', () => {
  describe('legacy page', () => {
    it('shows the /expenses page', () => {
      cy.visit('/railsgirlsatl/expenses/legacy');
      cy.wait(100);
      cy.get('.Expenses .expense').should('have.length', 20);
      cy.get('.ExpensesStats .categories li:nth-child(3) a').click();
      cy.get('.Expenses .expense').should('have.length', 5);
    });
  });
});
