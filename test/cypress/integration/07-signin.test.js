import { generateSecret, generateSync } from 'otplib';

describe('signin', () => {
  it('redirects directly when using a dev test account', () => {
    cy.visit('/signin?next=/testuseradmin');
    cy.get('input[name=email]').type('testuser+admin@opencollective.com');
    cy.get('button[type=submit]').click();
    cy.getByDataCy('collective-title').should('be.visible').contains('Test User Admin', { timeout: 15000 });
    cy.assertLoggedIn();
  });

  it('can signin with a valid token and is redirected', () => {
    cy.generateToken().then(token => {
      cy.visit(`/signin/${token}?next=/apex`);
    });

    cy.assertLoggedIn();
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });

  it('can signin with a valid token and is redirected, even if next is URL encoded', () => {
    cy.generateToken().then(token => {
      cy.visit(`/signin/${token}?next=%2Fapex`);
    });
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
    cy.generateToken(-100000).then(token => {
      cy.visit(`/signin?token=${token}`);
    });
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
    cy.generateToken(-1000000).then(token => {
      cy.visit(`/signin?token=${token}&next=/apex`);
    });

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
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard`);
  });
});

describe('signin with 2FA', () => {
  let user = null;
  let secret;
  let TOTPCode;

  before(() => {
    cy.mailpitDeleteAllEmails();
    cy.signup({ user: { settings: { features: { twoFactorAuth: true } } }, redirect: `/` })
      .then(async u => {
        user = u;
        secret = generateSecret({ length: 64 });
        return await cy.enableTwoFactorAuth({
          userEmail: user.email,
          userSlug: user.slug,
          secret: secret,
        });
      })
      .then(() => cy.logout());
  });

  it('can signin with 2fa enabled', () => {
    // now login with 2FA enabled
    cy.login({ email: user.email, redirect: '/apex' });
    cy.complete2FAPrompt('123456');
    cy.contains('Two-factor authentication code failed. Please try again').should.exist;
    TOTPCode = generateSync({ secret, algorithm: 'sha1', strategy: 'totp' });
    cy.complete2FAPrompt(TOTPCode);
    cy.assertLoggedIn();
    cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
  });
});
