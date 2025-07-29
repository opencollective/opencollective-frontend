import * as cheerio from 'cheerio';
import speakeasy from 'speakeasy';

describe('passwords', () => {
  let user;

  before(() => {
    cy.signup({ user: { name: 'Mr Bungle' } }).then(u => (user = u));
    cy.logout();
  });

  it('can be set from the settings page', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/user-security` });
    cy.contains("Setting a password is optional but can be useful if you're using a password manager.");

    // Submit disabled because no password set
    cy.contains('button', 'Set Password').should('be.disabled');

    // Test Validations
    cy.get('input#new-password').type('.');
    cy.getByDataCy('password-strength-bar').should('contain', 'too short');

    cy.get('input#new-password').type('{selectall}{backspace}12345678');
    cy.getByDataCy('password-strength-bar').should('contain', 'Weak');

    cy.get('input#new-password').type('{selectall}{backspace}qwerty');
    cy.getByDataCy('password-strength-bar').should('contain', 'Weak');

    cy.get('input#new-password').type('{selectall}{backspace}qwerty123456');
    cy.getByDataCy('password-strength-bar').should('contain', 'Weak');

    // Can't submit with a weak password
    cy.contains('button', 'Set Password').click();
    cy.contains(
      '[data-cy="password-error"]',
      'Password is too weak. Try to use more characters or use a password manager to generate a strong one.',
    );

    // Other strength levels
    cy.get('input#new-password').type('{selectall}{backspace}fairPasswd');
    cy.getByDataCy('password-strength-bar').should('contain', 'Fair');

    cy.get('input#new-password').type('{selectall}{backspace}g00dPasswd!');
    cy.getByDataCy('password-strength-bar').should('contain', 'Good');

    cy.get('input#new-password').type('{selectall}{backspace}qwerty123456!@#amazing!');
    cy.getByDataCy('password-strength-bar').should('contain', 'Strong');

    // Submit new password
    cy.contains('button', 'Set Password').click();
    cy.checkToast({ variant: 'success', message: 'Password successfully set' });
  });

  it('can then be edited', () => {
    cy.login({ sendLink: true, email: user.email, redirect: `/dashboard/${user.collective.slug}/user-security` });

    // Disable button if form is not complete
    cy.contains('button', 'Update Password').should('be.disabled');
    cy.get('input[name="current-password"]').type('nope');
    cy.contains('button', 'Update Password').should('be.disabled');

    // Passwords must not be the same
    cy.get('input#new-password').type('nope');
    cy.contains('button', 'Update Password').click();
    cy.contains('[data-cy="password-error"]', "New password can't be the same as current password");

    // Password must be strong
    cy.get('input#new-password').type('{selectall}{backspace}12345678');
    cy.contains('button', 'Update Password').click();
    cy.contains(
      '[data-cy="password-error"]',
      'Password is too weak. Try to use more characters or use a password manager to generate a strong one.',
    );

    // Old password must be valid
    cy.get('input#new-password').type('{selectall}{backspace}qwerty123456!@#amazing!"edited\'😊');
    cy.contains('button', 'Update Password').click();
    cy.contains('[data-cy="password-error"]', 'Invalid current password');

    // Submit new password
    cy.get('input[name="current-password"]').type('{selectall}{backspace}qwerty123456!@#amazing!');
    cy.contains('button', 'Update Password').click();
    cy.checkToast({ variant: 'success', message: 'Password successfully updated' });
  });

  it('can be used to login', () => {
    const completeSignInForm = () => {
      cy.visit(`/signin`);
      cy.get('input[name="email"]').type(user.email);
      cy.getByDataCy('signin-btn').click();
      cy.get('input[name="password"]:visible').type('WRONG'); // waiting for it to be visible since we add the field with "display: none" for password managers to prefill
      cy.getByDataCy('signin-btn').click();
      cy.checkToast({ variant: 'error', message: 'Invalid password' });
      cy.get('input[name="password"]:visible').type('{selectall}{backspace}qwerty123456!@#amazing!"edited\'😊');
      cy.getByDataCy('signin-btn').click();
      cy.getByDataCy('menu-item-overview').should('be.visible');
      cy.assertLoggedIn(user);
    };

    // Login with password on /signin
    cy.visit(`/signin`);
    completeSignInForm();

    // Logout
    cy.getByDataCy('user-menu-trigger').click();
    cy.getByDataCy('logout').click();

    // Login with password on protected page (`/${user.collective.slug}/dashboard/user-security`)
    cy.visit(`/dashboard/${user.collective.slug}/user-security`);
    completeSignInForm();
  });

  it('can be reset', () => {
    // Sign-in flow
    cy.visit(`/signin`);
    cy.get('input[name="email"]').type(user.email);
    cy.getByDataCy('signin-btn').click();
    cy.contains('[data-cy="signin-secondary-action-btn"]', 'Reset my password').click();
    cy.contains('Your reset password email is on its way');
    cy.contains(`We've sent it to ${user.email}`);

    // Email
    const expectedEmailPart = user.email.split('@')[0]; // On CI, email is replaced by email+bcc. We verify only the first part to have a consistent behavior between local and CI

    cy.openEmail(
      ({ Subject, To }) => To[0].Address.includes(expectedEmailPart) && Subject.includes('Reset Password'),
    ).then(email => {
      const $html = cheerio.load(email.HTML);
      const resetLink = $html('a:contains("Reset your password now")');
      const href = resetLink.attr('href');
      const parsedUrl = new URL(href);
      cy.visit(parsedUrl.pathname);
    });

    // Reset password page
    // Should have user info displayed
    cy.contains('[data-cy="resetPassword-form"]', user.email);
    cy.contains('[data-cy="resetPassword-form"]', 'Mr Bungle');
    cy.contains('h1', 'Reset Password');

    // Should not be able to submit with a weak password
    cy.get('input#new-password:visible').type('azerty123');
    cy.contains('button', 'Continue').click();
    cy.contains('[data-cy="resetPassword-form"]', 'Password is too weak');

    // Submit new password
    cy.get('input#new-password:visible').type('{selectall}{backspace}strongNewP@ssword<>?');
    cy.contains('[data-cy="resetPassword-form"] button', 'Continue').click();
    cy.contains('[data-cy="reset-password-success-page"]', 'Your password was updated.');

    cy.assertLoggedIn(user);
  });

  it('can be used in combination with 2FA', () => {
    // Enable 2FA on user
    const secret = speakeasy.generateSecret({ length: 64 });
    cy.enableTwoFactorAuth({ userEmail: user.email, userSlug: user.collective.slug, secret: secret.base32 });

    // Sign-in flow
    cy.visit(`/signin?next=/dashboard/${user.collective.slug}/info`);
    cy.get('input[name="email"]').type(user.email);
    cy.getByDataCy('signin-btn').click();
    cy.get('input[name="password"]:visible').type('strongNewP@ssword<>?');

    // 2FA required
    cy.getByDataCy('signin-btn').click();
    cy.complete2FAPrompt('123456');
    cy.contains('Two-factor authentication code failed. Please try again').should.exist;
    const code = speakeasy.totp({ algorithm: 'SHA1', encoding: 'base32', secret: secret.base32 });
    cy.complete2FAPrompt(code);

    // Wait for redirect
    cy.get('input[name="name"]').should('have.value', 'Mr Bungle');

    // Assert logged in
    cy.assertLoggedIn(user);
  });
});
