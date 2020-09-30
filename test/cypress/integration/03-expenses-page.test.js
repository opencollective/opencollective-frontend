describe('New expense flow ', () => {
  it('Show the /expenses page', () => {
    cy.visit(`/railsgirlsatl/expenses`);
    cy.getByDataCy('single-expense').should('have.length', 10);
    cy.getByDataCy('pagination-total').contains(4);
    cy.contains('[data-cy="single-expense"]:nth-child(1)', 'Food and Beverages');
  });

  it('Filter expenses', () => {
    cy.visit(`/railsgirlsatl/expenses`);

    // Filter by tag
    cy.contains('[data-cy="expense-tags-link"]', 'communication').click();
    cy.getByDataCy('single-expense').should('have.length', 7);
    cy.getByDataCy('pagination-total').contains(1);

    // Filter on amount
    cy.getByDataCy('expenses-filter-amount').click();
    cy.getByDataCy('select-option').contains('$50 to $500').click();

    // Remove tag
    cy.get('[data-cy="expense-tag"] [data-cy="remove-btn"]').click();
    cy.getByDataCy('single-expense').should('have.length', 10);

    // Filter on status
    cy.getByDataCy('expenses-filter-status').click();
    cy.getByDataCy('select-option').contains('Rejected').click();
    cy.getByDataCy('single-expense').should('have.length', 1);

    // Filter by period
    cy.getByDataCy('expenses-filter-period').click();
    cy.getByDataCy('select-option').contains('Past month').click();
    cy.getByDataCy('single-expense').should('have.length', 0);

    // Reset filters
    cy.getByDataCy('reset-expenses-filters').click();
    cy.getByDataCy('single-expense').should('have.length', 10);
  });
});
