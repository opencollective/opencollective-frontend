import { randomEmail } from '../support/faker';
import generateToken from '../support/token';

describe('signin', () => {
  it('redirects directly when using a dev test account', () => {
    cy.visit('/signin?next=/testuseradmin');
    cy.contains('button', 'Sign In').click();
    cy.get('input[name=email]').type('testuser+admin@opencollective.com');
    cy.get('button[type=submit]').click();
    cy.get('.LoginTopBarProfileButton-name').contains('testuseradmin', { timeout: 15000 });
  });

  it('can signin with a valid token and is redirected', () => {
    cy.visit(`/signin/${generateToken()}?next=/apex`);
    cy.assertLoggedIn();
    cy.get('.CollectiveCover h1', { timeout: 20000 }).contains('APEX');
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });

  it('can signin with a valid token and is redirected, even if next is URL encoded', () => {
    cy.visit(`/signin/${generateToken()}?next=%2Fapex`);
    cy.assertLoggedIn();
    cy.get('.CollectiveCover h1', { timeout: 20000 }).contains('APEX');
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });

  it('shows an error when token is invalid', () => {
    cy.visit('/signin?token=InvalidToken');
    cy.contains('Sign In failed: Token rejected.');
    cy.contains('You can ask for a new sign in link using the form below.');
    cy.contains('Sign in using your email address:');
    cy.get('input[name=email]').should('exist');
  });

  it('shows an error when token is expired', () => {
    cy.visit(`/signin?token=${generateToken(null, -100000)}`);
    cy.contains('Sign In failed: Token rejected.');
    cy.contains('You can ask for a new sign in link using the form below.');
    cy.contains('Sign in using your email address:');
    cy.get('input[name=email]').should('exist');
  });

  it('redirects if token is invalid but user is already logged in', () => {
    // Sign in with test account
    cy.visit('/signin?next=/testuseradmin');
    cy.contains('button', 'Sign In').click();
    cy.get('input[name=email]').type('testuser+admin@opencollective.com');
    cy.get('button[type=submit]').click();
    cy.assertLoggedIn();

    // Try to signin with an invalid token
    cy.visit('/signin?token=InvalidToken&next=/apex');

    // Should be logged in with the old account
    cy.assertLoggedIn();
    cy.get('.CollectiveCover h1', { timeout: 20000 }).contains('APEX');
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });

  it('redirects if token is expired but user is already logged in', () => {
    const user = { email: 'testuser+admin@opencollective.com' };

    // Sign in with test account
    cy.visit('/signin?next=/testuseradmin');
    cy.contains('button', 'Sign In').click();
    cy.get('input[name=email]').type(user.email);
    cy.get('button[type=submit]').click();
    cy.assertLoggedIn();

    // Try to signin with an expired token
    cy.visit(`/signin?token=${generateToken(null, -1000000)}&next=/apex`);

    // Should be logged in with the old account
    cy.assertLoggedIn();
    cy.get('.CollectiveCover h1', { timeout: 20000 }).contains('APEX');
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });

  it('trims the email when it has trailing spaces', () => {
    cy.visit('/signin');
    cy.get('input[name=email]').type('  user@opencollective.com  ');
    cy.get('input[name=email]').should('have.value', 'user@opencollective.com');
  });

  it('does not disable submit button when email has trailing spaces', () => {
    cy.visit('/signin');
    cy.get('input[name=email]').type('  user@opencollective.com  ');
    cy.get('button[type=submit]').should('not.be.disabled');
  });

  it("doesn't go into redirect loop if given own address in redirect", () => {
    cy.visit('/signin?next=/signin');
    cy.contains('button', 'Sign In').click();
    cy.get('input[name=email]').type('testuser+admin@opencollective.com');
    cy.get('button[type=submit]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
  });

  it('can signup as regular user', () => {
    cy.visit('/signin');

    // Test frontend validations
    cy.get('input[name=email]').type('Incorrect value');
    cy.get('button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'Incorrectvalue' is missing an '@'.");

    // Test backend validations
    cy.get('input[name=email]').type('{selectall}Incorrect@value');
    cy.get('button[type=submit]').click();
    cy.contains('Validation error: Email must be valid');

    // Submit the form with correct values
    const email = randomEmail(false);
    cy.get('input[name=email]').type(`{selectall}${email}`);
    cy.get('button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${email}.`);
  });

  it('can signup as organization', () => {
    cy.visit('/signin');
    // Select "Create oganization"
    cy.contains('Create Organization Profile').click();

    // Test frontend validations
    cy.get('input[name=orgName]').type('Test Organization');
    cy.get('input[name=email]').type('Incorrect value');
    cy.get('button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'Incorrectvalue' is missing an '@'.");

    // Test backend validations
    cy.get('input[name=email]').type('{selectall}Incorrect@value');
    cy.get('button[type=submit]').click();
    cy.contains('Validation error: Email must be valid');

    // Submit the form with correct values
    const email = randomEmail(false);
    cy.get('input[name=email]').type(`{selectall}${email}`);
    cy.get('button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${email}.`);
  });
});
