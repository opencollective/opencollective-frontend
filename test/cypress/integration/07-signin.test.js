import speakeasy from 'speakeasy';

import { randomEmail, randomGmailEmail, randomHotMail } from '../support/faker';
import generateToken from '../support/token';

describe('signin', () => {
  it('redirects directly when using a dev test account', () => {
    cy.visit('/signin?next=/testuseradmin');
    cy.get('input[name=email]').type('testuser+admin@opencollective.com');
    cy.get('button[type=submit]').click();
    cy.getByDataCy('collective-title').should('be.visible').contains('Test User Admin', { timeout: 15000 });
    cy.assertLoggedIn();
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
    cy.contains('Sign in or create a personal account to continue');
    cy.get('input[name=email]').should('exist');
  });

  it('shows an error when token is expired', () => {
    cy.visit(`/signin?token=${generateToken(null, -100000)}`);
    cy.contains('Sign In failed: Token rejected.');
    cy.contains('You can ask for a new sign in link using the form below.');
    cy.contains('Sign in or create a personal account to continue');
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
    cy.contains('a', 'Create an account').click();

    // Test frontend validations
    cy.get('input[name=name]').type('Dummy Name');
    cy.get('input[name=email]').type('IncorrectValue');
    cy.get('[data-cy=checkbox-tosOptIn] [data-cy=custom-checkbox]').click();
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
    cy.contains(`We've sent it to ${email}`);
  });

  it('after signup shows the /welcome page if there is no redirect', () => {
    cy.clearInbox();
    cy.visit('/signin');

    // Go to CreateProfile
    cy.contains('a', 'Create an account').click();

    cy.get('input[name=name]').type('John');

    // Submit the form with correct values
    const email = randomEmail();
    cy.get('input[name=email]').type(email);
    cy.get('[data-cy=checkbox-tosOptIn] [data-cy=custom-checkbox]').click();
    cy.get('button[type=submit]').click();

    const expectedEmailSubject = 'Open Collective: Sign In';
    cy.openEmail(({ subject }) => subject.includes(expectedEmailSubject));
    cy.contains('a', 'One-click Sign In').click();
    cy.wait(200);
    cy.contains('Welcome to Open Collective!');
  });

  it('after signup do not show the welcome page if there is a redirect', () => {
    cy.clearInbox();
    cy.visit('/signin?next=how-it-works');

    // Go to CreateProfile
    cy.contains('a', 'Create an account').click();

    cy.get('input[name=name]').type('Esther');

    // Submit the form with correct values
    const email = randomEmail();
    cy.get('input[name=email]').type(email);
    cy.get('[data-cy=checkbox-tosOptIn] [data-cy=custom-checkbox]').click();
    cy.get('button[type=submit]').click();

    const expectedEmailSubject = 'Open Collective: Sign In';
    cy.openEmail(({ subject }) => subject.includes(expectedEmailSubject));
    cy.contains('a', 'One-click Sign In').click();
    cy.wait(200);
    cy.contains('How Open Collective works');
  });

  it('can signup a user with gmail and show Open Gmail button ', () => {
    // Submit the form using the email providers--gmail)
    const gmailEmail = randomGmailEmail(false);
    cy.visit('/signin');
    cy.contains('a', 'Create an account').click();
    cy.get('input[name=name]').type('Dummy Name');
    cy.get('input[name=email]').type(`{selectall}${gmailEmail}`);
    cy.get('[data-cy=checkbox-tosOptIn] [data-cy=custom-checkbox]').click();
    cy.get('button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${gmailEmail}`);
    cy.getByDataCy('open-inbox-link').should(
      'have.prop',
      'href',
      'https://mail.google.com/mail/u/2/#advanced-search/subject=Open+Collective%3A+Sign+In&amp;subset=all&amp;within=2d',
    );
  });

  it('can signup a user with Hotmail and show Open Hotmail button', () => {
    // Submit the form using the email providers--hotmail
    const hotmail = randomHotMail(false);
    cy.visit('/signin');
    cy.contains('a', 'Create an account').click();
    cy.get('input[name=name]').type('Dummy Name');
    cy.get('input[name=email]').type(`{selectall}${hotmail}`);
    cy.get('[data-cy=checkbox-tosOptIn] [data-cy=custom-checkbox]').click();
    cy.get('button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${hotmail}`);
    cy.getByDataCy('open-inbox-link').should('have.prop', 'href', 'https://outlook.live.com/mail/inbox');
  });
});

describe('signin with 2FA', () => {
  let user = null;
  let secret;
  let TOTPCode;

  before(() => {
    cy.signup({ user: { settings: { features: { twoFactorAuth: true } } }, redirect: `/` }).then(u => (user = u));
    cy.logout();
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
    cy.complete2FAPrompt('123456');
    cy.contains('Two-factor authentication code failed. Please try again').should.exist;
    TOTPCode = speakeasy.totp({
      algorithm: 'SHA1',
      encoding: 'base32',
      secret: secret.base32,
    });
    cy.complete2FAPrompt(TOTPCode);
    cy.assertLoggedIn();
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });
});
