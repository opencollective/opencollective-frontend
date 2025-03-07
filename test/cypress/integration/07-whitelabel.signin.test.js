import * as cheerio from 'cheerio';

import { randomEmail, randomGmailEmail, randomHotMail } from '../support/faker';

describe('white-label signin', () => {
  it('gives renders error if domain is not authorized', () => {
    cy.visit(`http://local.crooked:3000/signin`);
    cy.contains('This page is not available on this domain');
  });

  it('redirects you to the main web url', () => {
    cy.visit(`http://local.opencollective:3000/signin`);
    cy.url().should('include', `${Cypress.config().baseUrl}`);
    cy.url().should('include', `?next=http%3A%2F%2Flocal.opencollective%3A3000`);
  });

  it('can signin with a valid token and redirected to white-labeled domain', () => {
    cy.generateToken().then(token => {
      cy.visit(`/signin/${token}?next=?next=http%3A%2F%2Flocal.opencollective%3A3000`);
    });
    cy.assertLoggedIn();
    cy.url().should('eq', `http://local.opencollective:3000/apex`);
  });

  it('can signup as regular user', () => {
    cy.visit(`http://local.opencollective:3000/signin`);

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
    cy.mailpitDeleteAllEmails();
    cy.visit(`http://local.opencollective:3000/signin`);

    // Go to CreateProfile
    cy.contains('a', 'Create an account').click();

    cy.get('input[name=name]').type('John');

    // Submit the form with correct values
    const email = randomEmail();
    cy.get('input[name=email]').type(email);
    cy.get('[data-cy=checkbox-tosOptIn] [data-cy=custom-checkbox]').click();
    cy.get('button[type=submit]').click();

    const expectedEmailSubject = 'Open Collective: Sign In';
    cy.openEmail(({ Subject }) => Subject.includes(expectedEmailSubject)).then(email => {
      const $html = cheerio.load(email.HTML);
      const resetLink = $html('a:contains("One-click Sign In")');
      const href = resetLink.attr('href');
      const parsedUrl = new URL(href);
      cy.visit(parsedUrl.pathname);
    });
  });

  xit('after signup do not show the welcome page if there is a redirect', () => {
    cy.mailpitDeleteAllEmails();
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
    cy.openEmail(({ Subject }) => Subject.includes(expectedEmailSubject)).then(email => {
      const $html = cheerio.load(email.HTML);
      const signInLink = $html('a:contains("One-click Sign In")');
      const href = signInLink.attr('href');
      const parsedUrl = new URL(href);
      cy.visit(parsedUrl.pathname + parsedUrl.search);
      cy.contains('How Open Collective works');
    });
  });

  xit('can signup a user with gmail and show Open Gmail button ', () => {
    // Submit the form using the email providers--gmail)
    const gmailEmail = randomGmailEmail();
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

  xit('can signup a user with Hotmail and show Open Hotmail button', () => {
    // Submit the form using the email providers--hotmail
    const hotmail = randomHotMail();
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

// xdescribe('signin with 2FA', () => {
//   let user = null;
//   let secret;
//   let TOTPCode;

//   before(() => {
//     cy.signup({ user: { settings: { features: { twoFactorAuth: true } } }, redirect: `/` }).then(u => (user = u));
//     cy.logout();
//   });

//   before(() => {
//     secret = speakeasy.generateSecret({ length: 64 });
//     cy.enableTwoFactorAuth({
//       userEmail: user.email,
//       userSlug: user.collective.slug,
//       secret: secret.base32,
//     });
//   });

//   it('can signin with 2fa enabled', () => {
//     // now login with 2FA enabled
//     cy.login({ email: user.email, redirect: '/apex' });
//     cy.complete2FAPrompt('123456');
//     cy.contains('Two-factor authentication code failed. Please try again').should.exist;
//     TOTPCode = speakeasy.totp({
//       algorithm: 'SHA1',
//       encoding: 'base32',
//       secret: secret.base32,
//     });
//     cy.complete2FAPrompt(TOTPCode);
//     cy.assertLoggedIn();
//     cy.url().should('eq', `${Cypress.config().baseUrl}/apex`);
//   });
// });
