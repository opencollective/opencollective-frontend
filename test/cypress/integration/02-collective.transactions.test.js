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

  it("shows the 'Download CSV' button", () => {
    cy.visit('/apex/transactions');
    cy.get('[data-cy=download-csv]').contains('Download CSV');
  });

  it('shows a message when the result is empty for the given date range', () => {
    cy.visit('/apex/transactions');
    cy.get('[data-cy=download-csv]').click();

    // Date range that won't ever contain any results
    cy.get('[data-cy=download-csv-start-date] input').click().type('1970-01-01').blur();
    cy.wait(300); // Second input doesn't get right value unless we wait
    cy.get('[data-cy=download-csv-end-date] input').click().type('1970-02-01').blur();

    // There should be an error message when download is clicked
    cy.wait(300);
    cy.get('[data-cy=download-csv-download]').click();

    // Then it should show an error message
    cy.get('[data-cy=download-csv-error]').contains('There are no transactions in this date range.');
  });
});
