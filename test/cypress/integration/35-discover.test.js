describe('Discover Page', () => {
  before(() => {
    cy.visit('/discover');
  });
  describe('Banner on discover page', () => {
    it('Shows the title and content on the banner', () => {
      cy.get('[data-cy=discover-banner]').contains('Discover awesome collectives to support');
      cy.get('[data-cy=discover-banner]').contains("Let's make great things together.");
      cy.get('[data-cy=discover-banner]')
        .find('form')
        .should('have.attr', 'action', '/search');
      cy.get('[data-cy=discover-banner]')
        .find('input')
        .should('have.attr', 'placeholder', 'Search tag');
    });
  });

  describe('All collectives section', () => {
    it('Shows All collectives with no filter', () => {
      cy.get('[data-cy=select]')
        .find('input')
        .should('have.attr', 'type', 'text');
      cy.get('[data-cy=select]').contains('Most popular');
      cy.get('[data-cy=container-collectives]')
        .children()
        .first()
        .get('[data-cy=caption]')
        .find('p')
        .contains('Financial contributors');
    });
  });
});
