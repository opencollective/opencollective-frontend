describe('Search docs on from help page', () => {
  it('Should search docs', () => {
    cy.intercept('GET', '/api/docs/search?*', { fixture: 'docs-search-results.json' }).as('searchDocs');
    cy.visit('/help');
    cy.getByDataCy('search-input').click();
    cy.getByDataCy('search-result-popup').contains('Type something to search');
    cy.getByDataCy('search-input').type('collective');
    cy.wait('@searchDocs');
    cy.get('[data-cy=search-result-popup]').within(() => {
      cy.getByDataCy('search-result-link').should('have.length', 10);
    });
  });

  it('Should search docs and show no results', () => {
    cy.intercept('GET', '/api/docs/search?*', {
      items: [],
    }).as('searchDocs');
    cy.visit('/help');
    cy.getByDataCy('search-input').click();
    cy.getByDataCy('search-result-popup').contains('Type something to search');
    cy.getByDataCy('search-input').type('collective');
    cy.wait('@searchDocs');
    cy.get('[data-cy=search-result-popup]').within(() => {
      cy.getByDataCy('search-result-link').should('not.exist');
      cy.contains('No results found for collective. Please type another keyword.');
    });
  });

  it('Should search docs, show no results, and show error', () => {
    cy.intercept('GET', '/api/docs/search?*', {
      forceNetworkError: true,
    }).as('searchDocs');
    cy.visit('/help');
    cy.getByDataCy('search-input').click();
    cy.getByDataCy('search-result-popup').contains('Type something to search');
    cy.getByDataCy('search-input').type('collective');
    cy.wait('@searchDocs');
    cy.checkToast({
      variant: 'error',
      message: 'Oops! There was an unexpected error.',
    });
    cy.get('[data-cy=search-result-popup]').within(() => {
      cy.getByDataCy('search-result-link').should('not.exist');
      cy.contains('No results found for collective. Please type another keyword.');
    });
  });
});
