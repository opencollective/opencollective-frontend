describe('New organization profile', () => {
  /**
   * Contributions section is already tested in `05-user_v2.test.js`
   * About section is already tested in `04-collective_v2.test.js`
   */
  beforeEach(() => {
    cy.createCollective({ type: 'ORGANIZATION' }).then(collective => {
      const collectiveSlug = collective.slug;
      cy.visit(`/${collectiveSlug}/`);
    });
  });
  describe('Contributors section', () => {
    it('Only shows core contributors without any filter', () => {
      cy.getByDataCy('filters').should('not.exist');
      cy.getByDataCy('section-contributors').click();
      cy.hash().should('eq', '#section-contributors');
      cy.getByDataCy('section-contributors-title').contains('Core contributors');
      cy.getByDataCy('ContributorsGrid_ContributorCard').contains('Collective Admin');
    });
  });

  describe('Transactions section', () => {
    // The rest of the transactions section tests are in `05-user_v2.test.js`
    it("Has no filters (because organizations don't have expenses)", () => {
      cy.getByDataCy('filters').should('not.exist');
      cy.getByDataCy('section-transactions').click();
      cy.hash().should('eq', '#section-transactions');
      cy.contains('h2', 'Transactions');
      cy.contains('No transaction yet');
    });
  });
});
