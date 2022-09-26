describe('Create collective from Github', () => {
  it('Should submit create github page', () => {
    cy.intercept('GET', '/api/github-repositories?*', { fixture: 'github-repos.json' });
    cy.login({ email: 'testuser@opencollective.com', redirect: '/opensource/apply/pick-repo?token=foofoo' });
    cy.contains('[data-cy=connect-github-header]', 'Pick a repository');
    cy.get('[data-cy=radio-select]').first().check();
    cy.get('[data-cy=radio-select]').eq(1).check('repository');
    cy.get('[data-cy=connect-github-continue]').click();
    cy.get('[data-cy=ccf-form-description]').type('Blocks some ads');
    cy.get('[data-cy=styled-input-tags-open]').click();
    cy.get('[data-cy=styled-input-tags-input]').type('opencollective-tag{enter}{esc}');
    cy.get('[data-cy=ccf-form-submit]').click();
    cy.contains('[data-cy=ccf-form]', 'This must be checked');
    cy.get('[data-cy=checkbox-tos]').click();
    cy.get('[data-cy=ccf-form-submit]').click();
    cy.url().should('include', '/adblockpluschrome/onboarding');
  });
});
