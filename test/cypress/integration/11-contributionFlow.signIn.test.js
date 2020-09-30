import { randomEmail } from '../support/faker';

const isNewContributionFlow = Cypress.env('NEW_CONTRIBUTION_FLOW');
const legacyFlowRoute = isNewContributionFlow ? '/apex/legacy/donate' : '/apex/donate';
const newFlowRoute = isNewContributionFlow ? '/apex/donate' : '/apex/new-donate';

describe('Contribution Flow: Sign In', () => {
  const validUserEmail = randomEmail();

  before(() => {
    cy.createCollective({ type: 'USER', email: validUserEmail });
  });

  describe('New flow', () => {
    it("Doesn't allow to submit if email is invalid", () => {
      cy.visit(newFlowRoute);
      cy.contains('button', 'Next step').click();
      cy.contains('[data-cy="cf-content"] button', 'Sign In').click();
      cy.get('[data-cy="cf-content"] input[name=email]').type('zzzzzzzzzzzzz');
      cy.get('[data-cy="cf-content"] button[type=submit]').should('be.disabled');
      cy.get('[data-cy="cf-content"] input[name=email]').blur();
      cy.contains("Please include an '@' in the email address. 'zzzzzzzzzzzzz' is missing an '@'.");
    });

    it("Shows a warning when email doesn't exist", () => {
      cy.visit(newFlowRoute);
      cy.contains('button', 'Next step').click();
      cy.contains('[data-cy="cf-content"] button', 'Sign In').click();
      cy.get('[data-cy="cf-content"] input[name=email]').type(randomEmail());
      cy.get('[data-cy="cf-content"] button[type=submit]').click();
      cy.contains('There is no user with this email address. Join for free!');
    });

    it('Works if given a valid email', () => {
      cy.visit(newFlowRoute);
      cy.contains('button', 'Next step').click();
      cy.contains('[data-cy="cf-content"] button', 'Sign In').click();
      cy.get('[data-cy="cf-content"] input[name=email]').type(validUserEmail);
      cy.get('[data-cy="cf-content"] button[type=submit]').click();

      // Test user are logged in directly
      cy.contains('Contribute As');
      cy.contains('Incognito');
      cy.contains('TestOrg');
    });
  });

  describe('Old flow', () => {
    it("Doesn't allow to submit if email is invalid", () => {
      cy.visit(legacyFlowRoute);

      cy.contains('[data-cy="cf-content"] button', 'Sign In').click();
      cy.get('[data-cy="cf-content"] input[name=email]').type('zzzzzzzzzzzzz');
      cy.get('[data-cy="cf-content"] button[type=submit]').should('be.disabled');
      cy.get('[data-cy="cf-content"] input[name=email]').blur();
      cy.contains("Please include an '@' in the email address. 'zzzzzzzzzzzzz' is missing an '@'.");
    });

    it("Shows a warning when email doesn't exist", () => {
      cy.visit(legacyFlowRoute);

      cy.contains('[data-cy="cf-content"] button', 'Sign In').click();
      cy.get('[data-cy="cf-content"] input[name=email]').type(randomEmail());
      cy.get('[data-cy="cf-content"] button[type=submit]').click();
      cy.contains('There is no user with this email address. Join for free!');
    });

    it('Works if given a valid email', () => {
      cy.visit(legacyFlowRoute);

      cy.contains('[data-cy="cf-content"] button', 'Sign In').click();
      cy.get('[data-cy="cf-content"] input[name=email]').type(validUserEmail);
      cy.get('[data-cy="cf-content"] button[type=submit]').click();

      // Test user are logged in directly
      cy.contains('Contribute As');
      cy.contains('Incognito');
      cy.contains('TestOrg');
    });
  });
});
