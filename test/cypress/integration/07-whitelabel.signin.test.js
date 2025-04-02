import speakeasy from 'speakeasy';

import { randomSlug } from '../support/faker';

describe('white-label signin', () => {
  const colSlug = randomSlug();
  before(() =>
    cy.createCollectiveV2({
      skipApproval: true,
      host: { slug: 'e2e-host' },
      collective: {
        slug: colSlug,
        name: `${colSlug} - whitelabel-test`,
        settings: { whitelabelDomain: 'http://local.opencollective:3000' },
      },
    }),
  );

  it('fails if domain is not authorized', () => {
    cy.visit(`http://local.crooked:3000/signin`);
    cy.contains('This page is not available on this domain');
  });

  it('fails if platform domain is asked to redirect to an unauthorized domain', () => {
    cy.visit(`http://localhost:3000/signin?next=${escape('http://local.crooked:3000')}`);
    cy.contains("You've been requested to log-in to Open Collective by an untrusted domain");
  });

  it('redirects you to the main web url', () => {
    cy.visit(`http://local.opencollective:3000/signin`);
    cy.url().should('include', `${Cypress.config().baseUrl}`);
    cy.url().should('include', `?next=http%3A%2F%2Flocal.opencollective%3A3000`);
  });

  it('can signin with a valid token and redirected to white-labeled domain', () => {
    cy.visit(`http://localhost:3000/signin`);
    cy.generateToken().then(token => {
      cy.visit(`/signin/${token}?next=http%3A%2F%2Flocal.opencollective%3A3000%2F${colSlug}`);
    });
    cy.assertLoggedIn();
    cy.url().should('eq', `http://local.opencollective:3000/${colSlug}`);
  });

  describe('signin with 2FA', () => {
    let user = null;
    let secret;
    let TOTPCode;

    before(() => {
      secret = speakeasy.generateSecret({ length: 64 });
      return cy
        .signup({ user: { settings: { features: { twoFactorAuth: true } } }, redirect: `/` })
        .then(u => {
          user = u;
          return cy.logout();
        })
        .then(() => {
          return cy.enableTwoFactorAuth({
            userEmail: user.email,
            userSlug: user.collective.slug,
            secret: secret.base32,
          });
        });
    });

    it('can signin with 2fa enabled', () => {
      // now login with 2FA enabled
      cy.login({ email: user.email, redirect: `http://local.opencollective:3000/${colSlug}` });
      cy.complete2FAPrompt('123456');
      cy.contains('Two-factor authentication code failed. Please try again').should.exist;
      TOTPCode = speakeasy.totp({
        algorithm: 'SHA1',
        encoding: 'base32',
        secret: secret.base32,
      });
      cy.complete2FAPrompt(TOTPCode);
      cy.assertLoggedIn();
      cy.url().should('eq', `http://local.opencollective:3000/${colSlug}`);
    });
  });
});
