describe('collective.transactions.exportCsv', () => {
  it("shows the 'Download CSV' button", () => {
    cy.visit('/apex/transactions');
    cy.get('.download-csv').contains('Download CSV');
  });

  it("shows popover with default dates when 'Download CSV' is clicked", () => {
    const todaysDate = Cypress.moment().format('MM/DD/YYYY');
    const lastMonthsFirstDay = Cypress.moment().subtract(1, 'months').startOf('month').format('MM/DD/YYYY');

    // Go to the URL & click on the download button
    cy.visit('/apex/transactions');
    cy.get('.download-csv').click();

    // Validate default dates
    cy.get('.dateFrom label').contains('Start date');
    cy.get('.dateFrom input').should('have.value', lastMonthsFirstDay);
    cy.get('.dateTo label').contains('End date');
    cy.get('.dateTo input').should('have.value', todaysDate);
  });

  it('shows a message when the result is empty for the given date range', () => {
    cy.visit('/apex/transactions');
    cy.get('.download-csv').click();

    // Date range that won't ever contain any results
    cy.get('.dateFrom input').clear().type('01/01/1970').blur();
    cy.wait(300); // Second input doesn't get right value unless we wait
    cy.get('.dateTo input').clear().type('01/02/1970').blur();

    // There should be an error message when download is clicked
    cy.wait(300);
    cy.get('#csv-date-range .popover-content button').click();

    // Then it should show an error message
    cy.get('.empty-search-error').contains('There are no transactions in this date range.');
  });
});
