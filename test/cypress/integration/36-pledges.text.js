describe('Pledges', () => {
  beforeEach(() => {
    cy.login({ redirect: `/pledges/new` });
  });

  it('Create the pledge', () => {
    cy.get('#name', { timeout: 200000 }).clear().type('samcaspus');
    cy.get('#slug', { timeout: 200000 }).clear().type('opencollective');
    cy.get('#githubHandle', { timeout: 200000 }).clear().type('opencollective/opencollective-frontend');
    cy.get('#publicMessage', { timeout: 200000 }).clear().type('publicMessage');
    cy.get('[type="submit"]', { timeout: 200000 }).click();

    cy.get('.Text__P-sc-3suny7-0-span.sfJZk', { timeout: 200000 }).eq(1).contains('$');
    cy.get('.src__Box-sc-1sbtrzs-0 .gpbLUB', { timeout: 200000 }).contains(
      'https://github.com/opencollective/opencollective-frontend',
    );
    cy.get('.Text__P-sc-3suny7-0-span .sfJZk').should('be.visible').contains('$');
  });
});
