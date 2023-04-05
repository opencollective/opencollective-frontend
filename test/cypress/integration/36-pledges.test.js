describe('Pledges', () => {
  beforeEach(() => {
    cy.login({ redirect: `/pledges/new` });
  });

  describe('creating an individual pledge', () => {
    it('Create the pledge', () => {
      cy.get('[data-cy=nameInput]').clear().type('samcaspus');
      cy.get('[data-cy=slugInput]').clear().type('opencollective-frontend');
      cy.get('[data-cy=githubHandleInput]').clear().type('opencollective/opencollective-frontend');
      cy.get('[id=publicMessage]').clear().type('publicMessage');
      cy.get('[data-cy="submit"]').click();
      cy.get('[data-cy="currencyAmount"]').should('contain', '$');
    });

    it('join an existing pledge individual pledge', () => {
      cy.visit('/opencollective-frontend');
      let value1 = '';
      cy.get('[data-cy="currencyAmount"]').then($val => {
        value1 = $val.text();
      });
      cy.get('[data-cy=makeAPledgeButton]').click();
      cy.get('[data-cy=publicMessage]').clear().type('publicMessage');
      cy.get('[data-cy="submit"]').click();
      cy.get('[data-cy="currencyAmount"]').should('contain', '$');
      cy.reload();
      cy.get('[data-cy="currencyAmount"]').then($val => {
        const value2 = $val.text();
        expect(value1).not.to.eq(value2);
      });
    });

    it('creating a pledge and ensuring the amount is visible loggedout', () => {
      cy.get('[data-cy=nameInput]').clear().type('samcaspus');
      cy.get('[data-cy=slugInput]').clear().type('opencollective-frontend');
      cy.get('[data-cy=githubHandleInput]').clear().type('opencollective/opencollective-frontend');
      cy.get('[id=publicMessage]').clear().type('publicMessage');
      cy.get('[data-cy="submit"]').click();
      cy.get('[data-cy="pledgeStats"]').contains('$');
      let amountOutside = '';
      cy.get('[data-cy="currencyAmount"]')
        .should('contain', '$')
        .then($val => {
          amountOutside = $val.text();
        });

      cy.get('[data-cy="user-menu-trigger"]').click();
      cy.get('[data-cy="logout"]').click();
      cy.visit('/opencollective-frontend/pledges/new');
      cy.get('[data-cy="amountPledgedTotal"] > span').should('contain', amountOutside);
    });
  });
  it('creating a pledge unable to verify the organization', () => {
    cy.get('[data-cy=nameInput]').clear().type('samcaspus3');
    cy.get('[data-cy=slugInput]').clear().type('demoslug');
    cy.get('[data-cy=githubHandleInput]').clear().type('demo');
    cy.get('[data-cy=publicMessage]').clear().type('publicMessage');
    cy.get('[data-cy="submit"]').click();
    cy.url().should('contain', '/pledges/new');

    cy.get('[data-cy="errorMessage"]').should('contain', 'Error: We could not verify the GitHub organization exists');
  });

  it('creating a pledge unable to verify the repository', () => {
    cy.get('[data-cy=nameInput]').clear().type('samcaspus4');
    cy.get('[data-cy=slugInput]').clear().type('demoslug');
    cy.get('[data-cy=githubHandleInput]').clear().type('demo/dummy');
    cy.get('[data-cy=publicMessage]').clear().type('publicMessage');
    cy.get('[data-cy="submit"]').click();
    cy.url().should('contain', '/pledges/new');
    cy.get('[data-cy="errorMessage"]').should('contain', 'Error: We could not verify the GitHub repository exists');
  });

  it('creating a pledge unable to verify the repository', () => {
    cy.get('[data-cy="submit"]').click();
    cy.get('[data-cy=nameInput]').clear().type('samcaspus4');
    cy.get('[data-cy=slugInput]').clear().type('demoslug');
    cy.get('[data-cy=githubHandleInput]').clear().type('demo/dummy');
    cy.get('[data-cy=publicMessage]').clear().type('publicMessage');
    cy.get('[data-cy="errorMessage"]').contains('Error: No collective id/website/githubHandle provided');

    cy.url().should('contain', '/pledges/new');
  });
});

describe('check FAQ context in each pledge is valid or not', () => {
  beforeEach(() => {
    cy.login({ redirect: `/pledges/new` });
  });

  it('verify what is pledge ?', () => {
    cy.get('[data-cy="whatIsAPledge"]').click();
    cy.get('[data-cy="whatIsAPledge"]').should('contain', 'towards a collective that hasn’t been created yet. If you');
  });

  it('verify how do i claim a pledge ?', () => {
    cy.get('[data-cy="howDoIClaimPledge"]').click();
    cy.get('[data-cy="howDoIClaimPledge"]').should('contain', 'to prove that you are an admin of this project');
  });
});

describe('Pledges Logged out', () => {
  it('verify if user can make a pledge without being loggedin', () => {
    cy.visit('/opencollective-frontend/pledges/new');
    cy.get('[data-cy="signupOrLogin"]').should('contain', 'Sign in or join free');
  });
  it('verify if loggedout pledged amount is same as logged in', () => {
    cy.visit('/opencollective-frontend/pledges/new');
    let amountOutside = '';
    cy.get('[data-cy="amountPledgedTotal"]').then($val => {
      amountOutside = $val.text();
    });
    cy.login();
    cy.visit('/opencollective-frontend');
    cy.get('[data-cy="currencyAmount"]').should('contain', amountOutside);
  });
});
