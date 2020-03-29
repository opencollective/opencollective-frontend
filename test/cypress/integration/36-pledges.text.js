describe('Pledges', () => {
  beforeEach(() => {
    cy.login({ redirect: `/pledges/new` });
  });

  describe('creating an individual pledge', () => {
    it('Create the pledge', () => {
      cy.get('[data-cy=name]', { timeout: 600000 }).clear().type('samcaspus');
      cy.get('[data-cy=slug]', { timeout: 600000 }).clear().type('opencollective');
      cy.get('[data-cy=githubHandle]', { timeout: 600000 }).clear().type('opencollective/opencollective-frontend');
      cy.get('[id=publicMessage]', { timeout: 600000 }).clear().type('publicMessage');
      cy.get('[data-cy="submit"]', { timeout: 600000 }).click();
      cy.get('[data-cy="pledgeStats"]', { timeout: 600000 }).contains('$');
      cy.get('[data-cy="pledgeStats"]', { timeout: 600000 }).should('contain', '$');
    });

    it('join an existing pledge individual pledge', () => {
      cy.get('[data-cy=name]', { timeout: 600000 }).clear().type('samcaspus2');
      cy.get('[data-cy=slug]', { timeout: 600000 }).clear().type('opencollective');
      cy.get('[data-cy=githubHandle]', { timeout: 600000 }).clear().type('opencollective/opencollective-frontend');
      cy.get('[data-cy=publicMessage]', { timeout: 600000 }).clear().type('publicMessage');
      cy.get('[data-cy="submit"]', { timeout: 600000 }).click();
      cy.get('[data-cy="pledgeStats"]', { timeout: 600000 }).contains('$');
      cy.get('[data-cy="pledgeStats"]', { timeout: 600000 }).should('contain', '$');
    });

    it('creating a pledge unable to verify the organization', () => {
      cy.get('[data-cy=name]', { timeout: 600000 }).clear().type('samcaspus3');
      cy.get('[data-cy=slug]', { timeout: 600000 }).clear().type('demoslug');
      cy.get('[data-cy=githubHandle]', { timeout: 600000 }).clear().type('demo');
      cy.get('[data-cy=publicMessage]', { timeout: 600000 }).clear().type('publicMessage');
      cy.get('[data-cy="submit"]', { timeout: 600000 }).click();
      cy.url().should('contain', '/pledges/new');

      cy.get('[data-cy="errorMessage"]', { timeout: 600000 }).should(
        'contain',
        'Error:  We could not verify the GitHub organization exists',
      );
    });

    it('creating a pledge unable to verify the repository', () => {
      cy.get('[data-cy=name]', { timeout: 600000 }).clear().type('samcaspus4');
      cy.get('[data-cy=slug]', { timeout: 600000 }).clear().type('demoslug');
      cy.get('[data-cy=githubHandle]', { timeout: 600000 }).clear().type('demo/dummy');
      cy.get('[data-cy=publicMessage]', { timeout: 600000 }).clear().type('publicMessage');
      cy.get('[data-cy="submit"]', { timeout: 600000 }).click();
      cy.url().should('contain', '/pledges/new');
      cy.get('[data-cy="errorMessage"]', { timeout: 600000 }).should(
        'contain',
        'Error:  We could not verify the GitHub repository exists',
      );
    });

    it('creating a pledge unable to verify the repository', () => {
      cy.get('[data-cy="submit"]', { timeout: 600000 }).click();
      cy.get('[data-cy=name]', { timeout: 600000 }).clear().type('samcaspus4');
      cy.get('[data-cy=slug]', { timeout: 600000 }).clear().type('demoslug');
      cy.get('[data-cy=githubHandle]', { timeout: 600000 }).clear().type('demo/dummy');
      cy.get('[data-cy=publicMessage]', { timeout: 600000 }).clear().type('publicMessage');
      cy.get('[data-cy="errorMessage"]', { timeout: 600000 }).contains(
        'Error: No collective id/website/githubHandle provided',
      );

      cy.url().should('contain', '/pledges/new');
    });
  });

  describe('check FAQ context in each pledge is valid or not', () => {
    it('verift what is pledge ?', () => {
      cy.get('[data-cy="whatIsAPledge"]', { timeout: 600000 }).click();
      cy.get('[data-cy="whatIsAPledge"]', { timeout: 600000 }).should(
        'contain',
        'towards a collective that hasn’t been created yet. If you',
      );
    });

    it('verift how do i claim a pledge ?', () => {
      cy.get('[data-cy="howDoIClaimPledge"]', { timeout: 600000 }).click();
      cy.get('[data-cy="howDoIClaimPledge"]', { timeout: 600000 }).should(
        'contain',
        'authenticate with the github profile that owns',
      );
    });
  });
});
