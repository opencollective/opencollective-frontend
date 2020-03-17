describe('New host page', () => {
  /**
   * About section is already tested in `04-collective_v2.test.js`
   */
  before(() => {
    cy.visit('/opensourceorg/v2');
  });

  describe('Contributions section', () => {
    // The rest of the contributions section is already tested in `05-user_v2.test.js`
    it('Show fiscally hosted collectives', () => {
      cy.contains('[data-cy~="filter-button"]', 'Hosted Collectives').click();
      cy.contains('[data-cy=Contributions]', 'Open Source Collective');
      cy.contains('[data-cy=Contributions]', 'APEX');
      cy.contains('[data-cy=Contributions]', 'tipbox');
      cy.contains('[data-cy=Contributions]', 'Test Collective');
    });
  });

  describe('Contributors section', () => {
    it('Only shows core contributors without any filter', () => {
      cy.get('[data-cy=Contributors] button').should('not.exist');
      cy.contains('[data-cy=contributors-grid]', /(pia mancini|Xavier Damma|Open Source Host User)/);
    });
  });

  describe('Transactions section', () => {
    // The rest of the transactions section tests are in `05-user_v2.test.js`
    it("Has no filters (because hosts don't create expenses)", () => {
      cy.contains('[data-cy~="filter-button"]', 'Expenses').should('not.exist');
    });
  });
});
