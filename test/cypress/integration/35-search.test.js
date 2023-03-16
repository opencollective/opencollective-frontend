describe('Discover Page', () => {
  beforeEach(() => {
    cy.visit('/search');
  });

  describe('Banner on search page', () => {
    it('Shows the title on the banner', () => {
      cy.get('[data-cy=search-banner]').contains('Search');
      cy.get('[data-cy=search-banner] form').should('have.attr', 'action', '/search');
      cy.get('[data-cy=search-banner] input').should(
        'have.attr',
        'placeholder',
        'Search by name, slug, tag, description...',
      );
    });
  });

  describe('All collectives section', () => {
    it('Shows All collectives with no filter', () => {
      cy.get('[data-cy=select]').contains('Activity');
      cy.get('[data-cy=collective-card] [data-cy=caption]').contains('Money raised');
    });
  });
});
