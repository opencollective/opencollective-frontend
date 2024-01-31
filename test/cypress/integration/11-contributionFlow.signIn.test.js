import { randomEmail } from '../support/faker';

describe('Contribution Flow: Sign In', () => {
  const validUserEmail = randomEmail();

  before(() => {
    cy.createCollective({ type: 'USER', email: validUserEmail });
  });

  it("Doesn't allow to submit if email is invalid", () => {
    cy.visit('/apex/donate');
    cy.get('button[data-cy="cf-next-step"]').click();

    cy.getByDataCy('cf-profile-signin-btn').click();

    cy.get('[data-cy="cf-content"] button[type=submit]').should('be.disabled');
    cy.get('[data-cy="cf-content"] input[name=email]').type('zzzzzzzzzzzzz');
    cy.get('[data-cy="cf-content"] input[name=email]').blur();
    cy.contains("Please include an '@' in the email address. 'zzzzzzzzzzzzz' is missing an '@'.");
  });

  it("Shows a warning when email doesn't exist", () => {
    cy.visit('/apex/donate');
    cy.get('button[data-cy="cf-next-step"]').click();

    cy.getByDataCy('cf-profile-signin-btn').click();

    const randEmail = randomEmail();

    cy.get('[data-cy="cf-content"] input[name=email]').type(randEmail);
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains(`${randEmail} does not exist on Doohi Collective. Would you like to create an account with this email?`);
  });

  it('Works if given a valid email', () => {
    cy.visit('/apex/donate');
    cy.get('button[data-cy="cf-next-step"]').click();

    cy.getByDataCy('cf-profile-signin-btn').click();

    cy.get('[data-cy="cf-content"] input[name=email]').type(validUserEmail);
    cy.get('[data-cy="cf-content"] button[type=submit]').click();

    // Test user gets logged in directly
    cy.contains('Contribute as');
    cy.contains('[data-cy="contribute-profile-picker"]', 'Personal profile - @incognito');
    cy.getByDataCy('contribute-profile-picker').click();
    cy.contains('[data-cy="select-option"]', 'TestOrg');
  });
});
