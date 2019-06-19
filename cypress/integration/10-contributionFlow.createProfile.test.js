import { randomEmail } from '../support/faker';

describe('Contribution Flow: Create profile', () => {
  it('Personal profile', () => {
    cy.visit('/apex/donate');

    // Test frontend validations
    cy.get('#content input[name=email]').type('Incorrect value');
    cy.get('#content button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'Incorrectvalue' is missing an '@'.");

    // Test backend validations
    cy.get('#content input[name=email]').type('{selectall}Incorrect@value');
    cy.get('#content button[type=submit]').click();
    cy.contains('Validation error: Email must be valid');

    // Submit the form with correct values
    const email = randomEmail();
    cy.get('#content input[name=email]').type(`{selectall}${email}`);
    cy.get('#content button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${email}.`);
  });

  it('Organization profile', () => {
    cy.visit('/apex/donate');

    // Select "Create oganization"
    cy.get('#content')
      .contains('Create Organization Profile')
      .click();

    // Test frontend validations
    cy.get('#content input[name=orgName]').type('Test Organization');
    cy.get('#content input[name=email]').type('Incorrect value');
    cy.get('#content button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'Incorrectvalue' is missing an '@'.");

    // Test backend validations
    cy.get('#content input[name=email]').type('{selectall}Incorrect@value');
    cy.get('#content button[type=submit]').click();
    cy.contains('Validation error: Email must be valid');

    // Submit the form with correct values
    const email = randomEmail();
    cy.get('#content input[name=email]').type(`{selectall}${email}`);
    cy.get('#content button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${email}.`);
  });
});
