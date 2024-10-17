import dayjs from 'dayjs';
import speakeasy from 'speakeasy';

describe('Personal Token', () => {
  let user;

  before(() => {
    cy.signup({ user: { name: 'Personal token tester', settings: { features: { adminPanel: true } } } }).then(
      u => (user = u),
    );
  });

  it('create and edit personal token', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/for-developers` });

    cy.log('Starts with an empty state');
    cy.contains('[data-cy="personal-tokens-list"]', "You don't have any token yet");

    cy.log('Create a first token using the message link');
    cy.getByDataCy('create-token-link').click();
    cy.get('input[name=name]').type('My first token');
    cy.getByDataCy('personal-token-scope').click().type('host{enter}').type('transactions{enter}');
    cy.get('input[name=expiresAt]').type(`${dayjs().add(1, 'day').format('YYYY-MM-DD')}`);
    cy.get('[data-cy="create-personal-token-modal"] button[type=submit]').click();
    cy.contains('[data-cy=toast-notification]:last', 'Personal token "My first token" created');

    cy.log('Lands on the token settings');
    cy.contains('[data-cy="personal-token-settings"] h3', 'My first token');
    cy.getByDataCy('personalToken-token').should('exist');

    cy.log('Returns to the tokens list to make sure it is there');
    cy.getByDataCy('go-back-link').click();
    cy.contains('[data-cy="personal-tokens-list"]', 'My first token');

    cy.log('Edit the token');
    cy.getByDataCy('personal-token').contains('a', 'Settings').click();
    cy.get('input[name=name]').clear().type('My first token (edited)');
    cy.getByDataCy('personal-token-scope').click().type('email{enter}');
    cy.get('input[name=expiresAt]')
      .clear()
      .type(`${dayjs().add(2, 'day').format('YYYY-MM-DD')}`);
    cy.get('[data-cy="personal-token-settings"] button[type=submit]').click();
    cy.contains('[data-cy=toast-notification]:last', 'Personal token "My first token (edited)" updated');

    cy.log('Returns to the tokens list to make sure it is there');
    cy.getByDataCy('go-back-link').click();
    cy.contains('[data-cy="personal-token"]', 'My first token (edited)');

    cy.log('Create a second token using the button');
    cy.getByDataCy('create-personal-token-btn').click();
    cy.get('input[name=name]').type('My second token');
    cy.getByDataCy('personal-token-scope').click().type('host{enter}').type('account{enter}');
    cy.get('input[name=expiresAt]').type(`${dayjs().add(1, 'day').format('YYYY-MM-DD')}`);
    cy.get('[data-cy="create-personal-token-modal"] button[type=submit]').click();
    cy.contains('[data-cy=toast-notification]:last', 'Personal token "My second token" created');
    cy.getByDataCy('personalToken-token').should('exist');

    cy.log('Returns to the tokens list to make sure it is there and sorted by creation date');
    cy.getByDataCy('go-back-link').click();
    cy.getByDataCy('personal-token').should('have.length', 2);
    cy.getByDataCy('personal-token').first().contains('My second token');
    cy.getByDataCy('personal-token').last().contains('My first token (edited)');

    cy.log('Delete the first token');
    cy.getByDataCy('personal-token').first().contains('a', 'Settings').click();
    cy.getByDataCy('personalToken-delete').click();
    cy.getByDataCy('confirmation-modal-continue').click();
    cy.contains('[data-cy=toast-notification]:last', 'Personal token "My second token" deleted');

    cy.log('confirm redirect and token is deleted');
    cy.getByDataCy('personal-tokens-list').should('exist');
    cy.getByDataCy('personal-token').should('have.length', 1);
    cy.getByDataCy('personal-token').first().contains('My first token (edited)');
  });

  it('create application with 2fa enabled', () => {
    cy.signup({ user: { name: 'Personal token tester', settings: { features: { adminPanel: true } } } }).then(user => {
      cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/for-developers` });

      const secret = speakeasy.generateSecret({ length: 64 });
      cy.enableTwoFactorAuth({
        userEmail: user.email,
        userSlug: user.collective.slug,
        secret: secret.base32,
      });

      cy.getByDataCy('create-token-link').click();
      cy.get('input[name=name]').type('My first token with 2fa');
      cy.getByDataCy('personal-token-scope').click().type('host{enter}').type('transactions{enter}');
      cy.get('input[name=expiresAt]').type(`${dayjs().add(1, 'day').format('YYYY-MM-DD')}`);
      cy.get('[data-cy="create-personal-token-modal"] button[type=submit]').click();

      cy.complete2FAPrompt(
        speakeasy.totp({
          algorithm: 'SHA1',
          encoding: 'base32',
          secret: secret.base32,
        }),
      );

      cy.contains('[data-cy=toast-notification]:last', 'Personal token "My first token with 2fa" created');
      cy.getByDataCy('personalToken-token').should('exist');
      cy.contains('[data-cy="personal-token-settings"] h3', 'My first token with 2fa');

      cy.log('Returns to the tokens list to make sure it is there');
      cy.getByDataCy('go-back-link').click();
      cy.contains('[data-cy="personal-tokens-list"]', 'My first token with 2fa');
    });
  });
});
