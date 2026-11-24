import * as cheerio from 'cheerio';

import { randomEmail } from '../support/faker';

// Outside production, the API may rewrite recipients (`@` → `-at-`)
const isSentTo = (To, email) =>
  To?.some(({ Address }) => Address.includes(email) || Address.includes(email.replace(/@/g, '-at-')));

describe('Contribution Flow: Create profile', () => {
  it('Personal profile', () => {
    // Create account is the default view when unauthenticated
    cy.visit('/apex/donate');
    // Skip the step details
    cy.get('button[data-cy="cf-next-step"]').click();

    // Should be on the Sign In Form
    cy.getByDataCy('cf-profile-signin-btn').click();
    // Should be able to go back to guest contributions
    cy.contains('[data-cy="cf-content"] button', 'Go back to contribute as a guest').click();
    // Should be able to sign in
    cy.getByDataCy('cf-profile-signin-btn').click();
    cy.contains('[data-cy="cf-content"] button', 'Create an account').click();
    cy.contains('[data-cy="cf-content"] button', '← Go back');

    // Set name
    cy.get('[data-cy="cf-content"] input[name=name]').type('Dummy Name');

    // Test frontend validations
    cy.get('[data-cy="cf-content"] input[name=name]').type('Test User');
    cy.get('[data-cy="cf-content"] input[name=email]').type('IncorrectValue');
    cy.get('[data-cy=checkbox-tosOptIn] [data-cy=custom-checkbox]').click();
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'IncorrectValue' is missing an '@'.");

    // Test backend validations
    cy.get('[data-cy="cf-content"] input[name=email]').type('{selectall}Incorrect@value');
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains('Invalid email address.');

    // Submit the form with correct values
    const email = randomEmail();
    cy.get('[data-cy="cf-content"] input[name=email]').type(`{selectall}${email}`);
    cy.get('[data-cy="cf-content"] button[type=submit]').click();

    // The code step replaces the form, still inside the contribution flow
    cy.getByDataCy('signup-code-form').as('code-form');
    cy.get('@code-form').contains(`Enter the code sent to ${email}.`);
    cy.contains('[data-cy="cf-content"] button', 'Go back to contribute as a guest');
    cy.openEmail(({ Subject, To }) => isSentTo(To, email) && Subject.includes('Email Confirmation')).then(message => {
      const otp = cheerio.load(message.HTML)('h3 > span').text().trim();
      cy.get('@code-form').find('input[data-slot="input-otp"]').type(otp);
    });

    // Signed in without leaving the flow, with the name from the form
    cy.contains('Contribute as');
    cy.contains('[data-cy="contribute-profile-picker"]', 'Dummy NameTest User');
    // The profile slug comes from the name, as it did with v1 `createUser`
    cy.contains('[data-cy="contribute-profile-picker"]', '@dummy-nametest-user');
    cy.url().should('include', '/apex/donate/profile');
  });
});
