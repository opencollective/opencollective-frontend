import speakeasy from 'speakeasy';

import { randomEmail, randomGmailEmail, randomHotMail } from '../support/faker';
import generateToken from '../support/token';

describe('signin', () => {
  it('redirects directly when using a dev test account', () => {
    cy.visit('/signin?next=/testuseradmin');
    cy.get('input[name=email]').type('testuser+admin@opencollective.com');
    cy.get('button[type=submit]').click();
    cy.getByDataCy('topbar-login-username').contains('Test User Admin', { timeout: 15000 });
  });

  it('can signin with a valid token and is redirected', () => {
    cy.visit(`/signin/${generateToken()}?next=/apex`);
    cy.assertLoggedIn();
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });

  it('can signin with a valid token and is redirected, even if next is URL encoded', () => {
    cy.visit(`/signin/${generateToken()}?next=%2Fapex`);
    cy.assertLoggedIn();
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
    cy.get('input[name=email]').type('testuser+admin@opencollective.com');
    cy.get('button[type=submit]').click();
    cy.assertLoggedIn();

    // Try to signin with an invalid token
    cy.visit('/signin?token=InvalidToken&next=/apex');

    // Should be logged in with the old account
    cy.assertLoggedIn();
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });

  it('redirects if token is expired but user is already logged in', () => {
    const user = { email: 'testuser+admin@opencollective.com' };

    // Sign in with test account
    cy.visit('/signin?next=/testuseradmin');
    cy.get('input[name=email]').type(user.email);
    cy.get('button[type=submit]').click();
    cy.assertLoggedIn();

    // Try to signin with an expired token
    cy.visit(`/signin?token=${generateToken(null, -1000000)}&next=/apex`);

    // Should be logged in with the old account
    cy.assertLoggedIn();
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
    cy.get('input[name=email]').type('testuser+admin@opencollective.com');
    cy.get('button[type=submit]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
  });

  it('can signup as regular user', () => {
    cy.visit('/signin');

    // Go to CreateProfile
    cy.contains('a', 'Join Free').click();

    // Test frontend validations
    cy.get('input[name=name]').type('Dummy Name');
    cy.get('input[name=email]').type('IncorrectValue');
    cy.get('button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'IncorrectValue' is missing an '@'.");

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

  it('can signup a user with gmail and show Open Gmail button ', () => {
    // Submit the form using the email providers--gmail)
    const gmail_email = randomGmailEmail(false);
    cy.visit('/signin');
    cy.contains('a', 'Join Free').click();
    cy.get('input[name=name]').type('Dummy Name');
    cy.get('input[name=email]').type(`{selectall}${gmail_email}`);
    cy.get('button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${gmail_email}.`);
    cy.getByDataCy('open-inbox-link').should(
      'have.prop',
      'href',
      'https://mail.google.com/mail/u/2/#advanced-search/subject=Open+Collective%3A+Login&amp;subset=all&amp;within=2d',
    );
  });

  it('can signup a user with Hotmail and show Open Hotmail button', () => {
    // Submit the form using the email providers--hotmail
    const hotmail = randomHotMail(false);
    cy.visit('/signin');
    cy.contains('a', 'Join Free').click();
    cy.get('input[name=name]').type('Dummy Name');
    cy.get('input[name=email]').type(`{selectall}${hotmail}`);
    cy.get('button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${hotmail}.`);
    cy.getByDataCy('open-inbox-link').should('have.prop', 'href', 'https://outlook.live.com/mail/inbox');
  });

  it('can signup as organization', () => {
    cy.visit('/signin');

    // Go to CreateProfile
    cy.contains('a', 'Join Free').click();

    // Select "Create oganization"
    cy.contains('Create Organization Profile').click();

    // Test frontend validations
    cy.get('input[name=name]').type('Dummy Name');
    cy.get('input[name=orgName]').type('Test Organization');
    cy.get('input[name=email]').type('IncorrectValue');
    cy.get('button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'IncorrectValue' is missing an '@'.");

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

describe('signin with 2FA', () => {
  let user = null;
  let secret;
  let TOTPCode;

  before(() => {
    cy.signup({ user: { settings: { features: { twoFactorAuth: true } } }, redirect: `/` }).then(u => (user = u));
  });

  before(() => {
    secret = speakeasy.generateSecret({ length: 64 });
    cy.enableTwoFactorAuth({
      userEmail: user.email,
      userSlug: user.collective.slug,
      secret: secret.base32,
    });
  });

  it('can signin with 2fa enabled', () => {
    // now login with 2FA enabled
    cy.login({ email: user.email, redirect: '/apex' });
    cy.getByDataCy('signin-two-factor-auth-input').type('123456');
    cy.getByDataCy('signin-two-factor-auth-button').click();
    cy.getByDataCy('signin-message-box').contains(
      'Sign In failed: Two-factor authentication code failed. Please try again',
    );
    TOTPCode = speakeasy.totp({
      algorithm: 'SHA1',
      encoding: 'base32',
      secret: secret.base32,
    });
    cy.getByDataCy('signin-two-factor-auth-input').clear().type(TOTPCode);
    cy.getByDataCy('signin-two-factor-auth-button').click();
    cy.assertLoggedIn();
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });
});
