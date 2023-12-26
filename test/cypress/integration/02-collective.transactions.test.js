describe('collective.transactions', () => {
  it('Should have no-index meta for user profiles', () => {
    cy.visit('/xdamman/transactions');
    cy.getByDataCy('transactions-page-content'); // Wait for page to be loaded
    cy.get('meta[name="robots"]').should('have.attr', 'content', 'none');
  });

  it('Should NOT have no-index meta for collectives', () => {
    cy.visit('/apex/transactions');
    cy.getByDataCy('transactions-page-content'); // Wait for page to be loaded
    cy.get('meta[name="robots"]').should('not.exist');
  });

  it("shows the 'Download CSV' button and popup feature buttons", () => {
    cy.visit('/apex/transactions');
    cy.get('[data-cy=download-csv]').should('exist');
  });
});
