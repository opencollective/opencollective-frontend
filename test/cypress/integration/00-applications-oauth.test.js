import speakeasy from 'speakeasy';

describe('OAuth Applications', () => {
  let user, clientId, clientSecret;

  before(() => {
    cy.signup({ user: { name: 'OAuth tester', settings: { features: { adminPanel: true } } } }).then(u => (user = u));
  });

  it('create and edit applications', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/for-developers` });

    cy.log('Starts with an empty state');
    cy.contains('[data-cy="oauth-apps-list"]', "You don't have any app yet");

    cy.log('Create a first app using the message link');
    cy.getByDataCy('create-app-link').click();
    cy.get('input[name=name]').type('My first App');
    cy.get('textarea[name=description]').type('A very accurate description');
    cy.get('input[name=redirectUri]').type('https://example.com/callback');
    cy.get('[data-cy="create-oauth-app-modal"] button[type=submit]').click();
    cy.contains('[data-cy=toast-notification]:last', 'Application "My first App" created');

    cy.log('Lands on the app settings');
    cy.contains('[data-cy="oauth-app-settings"] h3', 'My first App');

    cy.log('Returns to the apps list to make sure it is there');
    cy.getByDataCy('go-back-link').click();
    cy.contains('[data-cy="oauth-apps-list"]', 'My first App');

    cy.log('Go and edit the app');
    cy.getByDataCy('oauth-app').contains('a', 'Settings').click();
    cy.get('input[name=name]').clear().type('{selectall}My first App (edited)');
    cy.get('textarea[name=description]').clear().type('{selectall}A very accurate description (edited)');
    cy.get('input[name=redirectUri]').clear().type('https://example2.com/callback');
    cy.get('[data-cy="oauth-app-settings"] button[type=submit]').click();
    cy.contains('[data-cy=toast-notification]:last', 'Application "My first App (edited)" updated');

    cy.log('Returns to the apps list to make sure it gets updated in the list');
    cy.getByDataCy('go-back-link').click();
    cy.getByDataCy('oauth-app').contains('My first App (edited)');

    cy.log('Create another app using the button');
    cy.getByDataCy('create-app-btn').click();
    cy.get('input[name=name]').type('My second App');
    cy.get('textarea[name=description]').type('A very accurate description');
    cy.get('input[name=redirectUri]').type('http://localhost:3000/pricing');
    cy.get('[data-cy="create-oauth-app-modal"] button[type=submit]').click();
    cy.contains('[data-cy=toast-notification]:last', 'Application "My second App" created');

    cy.log('Returns to the apps list to make sure it is there and apps are sorted by creation date (newsest first)');
    cy.getByDataCy('go-back-link').click();
    cy.getByDataCy('oauth-app').should('have.length', 2);
    cy.getByDataCy('oauth-app').first().contains('My second App');
    cy.getByDataCy('oauth-app').last().contains('My first App (edited)');

    cy.log('Get credentials from the settings page');
    cy.getByDataCy('oauth-app').first().contains('a', 'Settings').click();
    cy.getByDataCy('oauth-app-client-id').should('exist');
    cy.getByDataCy('unhidden-secret').should('not.exist'); // client secret is hidden
    cy.getByDataCy('show-secret-btn').click();
    cy.getByDataCy('unhidden-secret').should('exist'); // client secret is hidden
    cy.getByDataCy('oauth-app-client-id').then($elem => (clientId = $elem.text()));
    cy.getByDataCy('unhidden-secret').then($elem => (clientSecret = $elem.text()));
  });

  it('create application with 2fa enabled', () => {
    cy.signup({ user: { name: 'OAuth tester', settings: { features: { adminPanel: true } } } }).then(user => {
      cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/for-developers` });

      const secret = speakeasy.generateSecret({ length: 64 });
      cy.enableTwoFactorAuth({
        userEmail: user.email,
        userSlug: user.collective.slug,
        secret: secret.base32,
      });

      cy.getByDataCy('create-app-link').click();
      cy.get('input[name=name]').type('My App created with 2FA enabled');
      cy.get('textarea[name=description]').type('A very accurate description');
      cy.get('input[name=redirectUri]').type('https://example.com/callback');
      cy.get('[data-cy="create-oauth-app-modal"] button[type=submit]').click();

      cy.complete2FAPrompt(
        speakeasy.totp({
          algorithm: 'SHA1',
          encoding: 'base32',
          secret: secret.base32,
        }),
      );

      cy.contains('[data-cy=toast-notification]:last', 'Application "My App created with 2FA enabled" created');

      cy.log('Lands on the app settings');
      cy.contains('[data-cy="oauth-app-settings"] h3', 'My App created with 2FA enabled');

      cy.log('Returns to the apps list to make sure it is there');
      cy.getByDataCy('go-back-link').click();
      cy.contains('[data-cy="oauth-apps-list"]', 'My App created with 2FA enabled');
    });
  });

  // Warning: this test is dependant on the previous one. To make it independent, create the OAuth app with a direct GraphQL request
  it('go through the OAuth flow', () => {
    cy.log('Go to the OAuth authorization page');
    const url = `/oauth/authorize?client_id=${clientId}&response_type=code&state=hello_world`;
    cy.login({ email: user.email, redirect: encodeURIComponent(url) });
    cy.contains('My second App');
    cy.contains('button', 'Authorize').click();
    cy.contains('Redirecting');

    cy.log('Redirected to a custom page');
    cy.url().should('include', '/pricing');
    cy.url().then(url => {
      const parsedUrl = new URL(url);
      const code = parsedUrl.searchParams.get('code');
      const state = parsedUrl.searchParams.get('state');
      expect(state).to.equal('hello_world');
      expect(code).to.have.length(64);

      cy.log('Exchange code for token');
      cy.request({
        url: `${Cypress.config('baseUrl')}/api/oauth/token`,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: {
          /* eslint-disable camelcase */
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: 'http://localhost:3000/pricing',
          /* eslint-enable camelcase */
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('access_token');
      });
    });
  });

  // Warning: this test is dependant on the previous one. To make it independent, connect the OAuth app with
  it('can list & revoke authorization tokens in the admin', () => {
    cy.log('App is in list');
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/authorized-apps` });
    cy.getByDataCy('connected-oauth-app').should('have.length', 1);
    cy.getByDataCy('connected-oauth-app').should('contain', 'My second App');

    cy.log('Revoke authorization');
    cy.getByDataCy('oauth-app-revoke-btn').click();
    cy.contains('[data-cy=toast-notification]:last', 'Authorization for My second App revoked');
    cy.getByDataCy('connected-oauth-app').should('not.exist');
    cy.contains(`No Authorized App yet`);
  });
});
