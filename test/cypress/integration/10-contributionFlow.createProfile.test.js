import { randomEmail } from '../support/faker';

describe('Contribution Flow: Create profile', () => {
  it('Personal profile', () => {
    // Create account is the default view when unauthenticated
    cy.visit('/apex/donate');

    // Skip the step details
    cy.get('button[data-cy="cf-next-step"]').click();

    // Should be on the Sign In Form
    cy.getByDataCy('cf-profile-signin-btn').click();
    // Should be able to go back to guest contributions
    cy.contains('[data-cy="cf-content"] button', 'Go back to contribute as a guest').click();
    // Should be able to sign in
    cy.getByDataCy('cf-profile-signin-btn').click();
    cy.contains('[data-cy="cf-content"] button', 'Create an account').click();
    cy.contains('[data-cy="cf-content"] button', '← Go back');

    // Set name
    cy.get('[data-cy="cf-content"] input[name=name]').type('Dummy Name');

    // Test frontend validations
    cy.get('[data-cy="cf-content"] input[name=name]').type('Test User');
    cy.get('[data-cy="cf-content"] input[name=email]').type('IncorrectValue');
    cy.get('[data-cy=checkbox-tosOptIn] [data-cy=custom-checkbox]').click();
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'IncorrectValue' is missing an '@'.");

    // Test backend validations
    cy.get('[data-cy="cf-content"] input[name=email]').type('{selectall}Incorrect@value');
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains('Validation error: Email must be valid');

    // Submit the form with correct values
    const email = randomEmail();
    cy.get('[data-cy="cf-content"] input[name=email]').type(`{selectall}${email}`);
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${email}`);
  });
});
