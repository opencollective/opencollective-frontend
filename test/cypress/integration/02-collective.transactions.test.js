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

  it('can download the transaction receipt', () => {
    // Default user is an admin of brusselstogether collective
    cy.login({ redirect: '/brusselstogether/transactions' });
    cy.contains('button[data-cy=transaction-details]', 'View Details').first().click();
    cy.getByDataCy('download-transaction-receipt-btn').first().click();
    cy.waitForDownload('brusselstogether_2017-12-04_b961becd-cb85-6c70-6ec5-075151203084.pdf').then(file => {
      cy.task('readPdf', file)
        .should('contain', 'BrusselsTogether	ASBL') // Bill from
        .should('contain', 'Frederik') // Bill to
        .should('contain', 'brusselstogetherasbl_b961becd-cb85-6c70-6ec5-075151203084')
        .should('contain', `Contribution	#1037`)
        .should('contain', '2017-12-04')
        .should('contain', 'monthly	recurring	subscription')
        .should('contain', '$10.00');
    });
  });
});
