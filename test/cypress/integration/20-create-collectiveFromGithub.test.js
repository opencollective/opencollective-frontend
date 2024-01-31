describe('Create collective from Github', () => {
  it('Should submit create github page', () => {
    cy.intercept('GET', '/api/github-repositories?*', { fixture: 'github-repos.json' });
    cy.login({ email: 'testuser@doohicollective.org', redirect: '/opensource/apply/pick-repo?token=foofoo' });
    cy.contains('[data-cy=connect-github-header]', 'Pick a repository');
    cy.get('[data-cy=radio-select]').first().check();
    cy.get('[data-cy=connect-github-continue]').click();
    cy.get('[data-cy=ccf-form-description]').type('Blocks some ads');
    cy.get('[data-cy=ccf-form-message]').type('We need to gather some money');
    cy.get('[data-cy=ccf-form-submit]').click();
    cy.contains('[data-cy=ccf-form]', 'This must be checked');
    cy.get('[data-cy=checkbox-termsOfServiceOC]').find('[data-cy=custom-checkbox]').click();
    cy.get('[data-cy=ccf-form-submit]').click();
    cy.url().should('include', '/adblockpluschrome/onboarding');
  });
});
