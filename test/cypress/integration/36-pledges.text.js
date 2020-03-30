describe('Pledges', () => {
  beforeEach(() => {
    cy.login({ redirect: `/pledges/new` });
  });

  describe('creating an individual pledge', () => {
    it('Create the pledge', () => {
      cy.get('[data-cy=nameInput]').clear().type('samcaspus');
      cy.get('[data-cy=slugInput]').clear().type('opencollective');
      cy.get('[data-cy=githubHandleInput]').clear().type('opencollective/opencollective-frontend');
      cy.get('[id=publicMessage]').clear().type('publicMessage');
      cy.get('[data-cy="submit"]').click();
      cy.get('[data-cy="pledgeStats"]', { timeout: 600000 }).contains('$');
      cy.get('[data-cy="currencyAmount"]', { timeout: 600000 }).should('contain', '$');
    });

    it('join an existing pledge individual pledge', () => {
      cy.visit('/opencollective');
      var value1 = '';
      cy.get('[data-cy="currencyAmount"]', { timeout: 600000 }).then($val => {
        value1 = $val.text();
      });
      cy.get('[data-cy=makeAPledgeButton]').click();
      cy.get('[data-cy=publicMessage]').clear().type('publicMessage');
      cy.get('[data-cy="submit"]').click();
      cy.get('[data-cy="pledgeStats"]', { timeout: 600000 }).contains('$');
      cy.get('[data-cy="currencyAmount"]', { timeout: 600000 }).should('contain', '$');
      cy.reload();
      cy.get('[data-cy="currencyAmount"]', { timeout: 600000 }).then($val => {
        var value2 = $val.text();
        expect(value1).not.to.eq(value2);
      });
    });

    it('creating a pledge unable to verify the organization', () => {
      cy.get('[data-cy=nameInput]').clear().type('samcaspus3');
      cy.get('[data-cy=slugInput]').clear().type('demoslug');
      cy.get('[data-cy=githubHandleInput]').clear().type('demo');
      cy.get('[data-cy=publicMessage]').clear().type('publicMessage');
      cy.get('[data-cy="submit"]').click();
      cy.url().should('contain', '/pledges/new');

      cy.get('[data-cy="errorMessage"]', { timeout: 600000 }).should(
        'contain',
        'Error:  We could not verify the GitHub organization exists',
      );
    });

    it('creating a pledge unable to verify the repository', () => {
      cy.get('[data-cy=nameInput]').clear().type('samcaspus4');
      cy.get('[data-cy=slugInput]').clear().type('demoslug');
      cy.get('[data-cy=githubHandleInput]').clear().type('demo/dummy');
      cy.get('[data-cy=publicMessage]').clear().type('publicMessage');
      cy.get('[data-cy="submit"]').click();
      cy.url().should('contain', '/pledges/new');
      cy.get('[data-cy="errorMessage"]', { timeout: 600000 }).should(
        'contain',
        'Error:  We could not verify the GitHub repository exists',
      );
    });

    it('creating a pledge unable to verify the repository', () => {
      cy.get('[data-cy="submit"]').click();
      cy.get('[data-cy=nameInput]').clear().type('samcaspus4');
      cy.get('[data-cy=slugInput]').clear().type('demoslug');
      cy.get('[data-cy=githubHandleInput]').clear().type('demo/dummy');
      cy.get('[data-cy=publicMessage]').clear().type('publicMessage');
      cy.get('[data-cy="errorMessage"]', { timeout: 600000 }).contains(
        'Error: No collective id/website/githubHandle provided',
      );

      cy.url().should('contain', '/pledges/new');
    });
  });

  describe('check FAQ context in each pledge is valid or not', () => {
    it('verift what is pledge ?', () => {
      cy.get('[data-cy="whatIsAPledge"]').click();
      cy.get('[data-cy="whatIsAPledge"]', { timeout: 600000 }).should(
        'contain',
        'towards a collective that hasn’t been created yet. If you',
      );
    });

    it('verift how do i claim a pledge ?', () => {
      cy.get('[data-cy="howDoIClaimPledge"]').click();
      cy.get('[data-cy="howDoIClaimPledge"]', { timeout: 600000 }).should(
        'contain',
        'authenticate with the github profile that owns',
      );
    });
  });
});
