import { randomEmail } from '../support/faker';

describe('Contribution Flow: Create profile', () => {
  it('Organization profile', () => {
    // Create account is the default view when unauthenticated
    cy.visit('/apex/donate');

    // Skip the step details
    cy.get('button[data-cy="cf-next-step"]').click();

    // Should be o the "Contribute as an organization form"
    cy.getByDataCy('cf-profile-signin-btn').click();
    // Should be able to go back to guest contributions
    cy.contains('[data-cy="cf-content"] button', 'Go back to contribute as a guest');
    // Should be able to sign in
    cy.contains('[data-cy="cf-content"]', 'Already have an account?');
    cy.contains('[data-cy="cf-content"] button', 'Sign In →');

    // Set name
    cy.get('[data-cy="cf-content"] input[name=name]').type('Dummy Name');

    // Test frontend validations
    cy.get('[data-cy="cf-content"] input[name=orgName]').type('Test Organization');
    cy.get('[data-cy="cf-content"] input[name=email]').type('IncorrectValue');
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
    cy.contains(`We've sent it to ${email}.`);
  });
});
