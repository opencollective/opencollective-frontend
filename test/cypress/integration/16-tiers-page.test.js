Cypress.on('test:after:run', attributes => {
  /* eslint-disable no-console */
  console.log('Test "%s" has finished in %dms', attributes.title, attributes.duration);
});

describe('Tiers page', () => {
  Cypress._.times(10, () => {
    it('Can be accessed from "/collective/contribute" (default)', () => {
      cy.visit('/apex/contribute');
      cy.get('head > title').should('have.text', 'Contribute to APEX - Open Collective');
      cy.get('link[rel=canonical]').should('have.attr', 'href', `${Cypress.config().baseUrl}/apex/contribute`);
    });

    it('Can be accessed from "/collective/tiers"', () => {
      // The routes changed in https://github.com/opencollective/opencollective-frontend/pull/1876
      // This test ensure that we still support the old routes schemes. After some time
      // and if the logs confirm that these routes are not used anymore, it will be
      // safe to delete these tests.
      cy.visit('/apex/tiers');
      cy.get('head > title').should('have.text', 'Contribute to APEX - Open Collective');
      cy.get('link[rel=canonical]').should('have.attr', 'href', `${Cypress.config().baseUrl}/apex/contribute`);
    });
  });
});
