import { randomEmail } from '../support/faker';

describe('Contribution Flow: Create profile', () => {
  it('Personal profile', () => {
    // Create account is the default view when unauthenticated
    cy.visit('/apex/donate');

    // Skip the step details on the new contribution flow
    cy.contains('button', 'Next step').click();

    // Has TOS
    cy.contains('By joining, you agree to our Terms of Service and Privacy Policy.');
    cy.get('[data-cy="join-conditions"] a[href="/tos"]');
    cy.get('[data-cy="join-conditions"] a[href="/privacypolicy"]');

    // Set name
    cy.get('[data-cy="cf-content"] input[name=name]').type('Dummy Name');

    // Test frontend validations
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

  it('Organization profile', () => {
    // Create account is the default view when unauthenticated
    cy.visit('/apex/donate');

    // Skip the step details on the new contribution flow
    cy.contains('button', 'Next step').click();

    // Select "Create oganization"
    cy.get('[data-cy="cf-content"]').contains('Contribute as an organization').click();

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
