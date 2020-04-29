describe('Create collective from Github', () => {
  it('Should submit create github page', () => {
    cy.server();
    cy.route({
      method: 'GET',
      url: '/api/github-repositories?*',
      response: [
        {
          description: 'Adblock Plus browser extension',
          fork: true,
          full_name: 'flickz/adblockpluschrome',
          name: 'adblockpluschrome',
          owner: { login: 'flickz', type: 'Organization' },
          stargazers_count: 113,
        },
        {
          description:
            'A new form of association, transparent by design. Please report issues there. Feature requests and ideas welcome!',
          fork: true,
          full_name: 'flickz/jobtweets',
          name: 'JobTweets',
          owner: { login: 'flickz', type: 'User' },
          stargazers_count: 103,
        },
      ],
    });
    cy.login({ email: 'testuser@opencollective.com', redirect: '/create/opensource?token=foofoo' });
    cy.contains('[data-cy=connect-github-header]', 'Pick a repository');
    cy.get('[data-cy=radio-select]').first().check();
    cy.get('[data-cy=radio-select]').eq(1).check('repository');
    cy.get('[data-cy=connect-github-continue]').click();
    cy.get('[data-cy=ccf-form-description]').type('Blocks some ads');
    cy.get('[data-cy=ccf-form-submit]').click();
    cy.get('[data-cy=ccf-error-message]').contains('Please accept the terms of service');
    cy.get('[data-cy="custom-checkbox"').click();
    cy.get('[data-cy=ccf-form-submit]').click();
    cy.location().should(location => {
      expect(location.search).to.include('?status=collectiveCreated');
    });
  });
});
