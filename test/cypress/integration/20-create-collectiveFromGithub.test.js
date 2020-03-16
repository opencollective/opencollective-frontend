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
    cy.login({ email: 'testuser@opencollective.com', redirect: '/opensource/create/legacy?token=foofoo' });
    cy.contains('Pick a repository');
    cy.get('[type="radio"]')
      .first()
      .check();
    cy.get('[name="name"]')
      .first()
      .type('Adblock plus');
    cy.get('[name="slug"]')
      .first()
      .type('adblock');
    cy.get('[type="submit"]')
      .first()
      .click();
    cy.location().should(location => {
      expect(location.search).to.eq('?status=collectiveCreated');
    });
  });
});
