describe('New host page', () => {
  /**
   * About section is already tested in `04-collective.test.js`
   */
  beforeEach(() => {
    cy.visit('/opensource');
  });

  it('Should not have no-index meta', () => {
    // Wait for page to be loaded
    cy.getByDataCy('collective-title');
    cy.get('meta[name="robots"]').should('not.exist');
  });

  describe('Contributions section', () => {
    // The rest of the contributions section is already tested in `05-user.test.js`
    it('Show fiscally hosted collectives', () => {
      cy.contains('[data-cy~="filter-button"]', 'Hosted Collectives').click();
      cy.contains('[data-cy=Contributions]', 'Open Source Collective');
      cy.contains('[data-cy=Contributions]', 'APEX');
      cy.contains('[data-cy=Contributions]', 'tipbox');
      cy.contains('[data-cy=Contributions]', 'Test Collective');
    });
  });

  describe('About category', () => {
    it('Show team members', () => {
      cy.contains('[data-cy=section-our-team]', /(pia mancini|Xavier Damma|Open Source Host User)/);
    });
  });
});
