import * as cheerio from 'cheerio';

import { defaultTestUserEmail } from '../support/data';
import { randomEmail } from '../support/faker';

describe('Users can change their email address', () => {
  let user = null;
  let newEmail = null;

  before(() => {
    cy.signup({ redirect: '/tos' }).then(u => (user = u));
    cy.mailpitDeleteAllEmails();
    newEmail = randomEmail();
  });

  it('uses a form in advanced settings', () => {
    // Go to /dashboard/:collective/advanced
    cy.visit(`/dashboard/${user.collective.slug}/advanced`);

    // Initial form should have current email in it
    cy.get('[data-cy=EditUserEmailForm] input[name=email]').should('have.value', user.email);

    // Submit disabled if value is incorrect
    cy.get('[data-cy=EditUserEmailForm] input[name=email]').type('{selectall}NotAValidEmail');
    cy.contains('[data-cy=EditUserEmailForm] button', 'Confirm new email').should('be.disabled');

    // Email is already taken by another user
    cy.get('[data-cy=EditUserEmailForm] input[name=email]').type(`{selectall}${defaultTestUserEmail}`);
    cy.contains('[data-cy=EditUserEmailForm] button', 'Confirm new email').click();
    cy.contains('[data-cy=EditUserEmailForm]', 'A user with that email already exists');

    // Let do it, for good this time
    cy.get('[data-cy=EditUserEmailForm] input[name=email]').type(`{selectall}${newEmail}`);
    cy.contains('[data-cy=EditUserEmailForm] button', 'Confirm new email').click();
    cy.contains('[data-cy=EditUserEmailForm]', `An email with a confirmation link has been sent to ${newEmail}`);
    cy.get('[data-cy=EditUserEmailForm] input[name=email]').should('have.value', newEmail);
  });

  it('sends a confirmation email to confirm the change', () => {
    const subject = `Confirm your email ${newEmail} on Open Collective`;

    cy.openEmail(({ Subject }) => Subject.includes(subject)).then(email => {
      const $html = cheerio.load(email.HTML);
      expect($html('body').text()).to.contain(`We need to verify that ${newEmail} is correct by clicking this button:`);
      const confirmLink = $html('a:contains("Confirm Email")');
      const parsedLink = new URL(confirmLink.attr('href'));
      cy.visit(parsedLink.pathname + parsedLink.search);
      cy.contains('Validating your email address...');
      // Show loading state
      cy.contains('Validating your email address...');
      // Then ensure we validate the change
      cy.contains('Your email has been changed');
    });
  });

  it('shows an error if validation link is invalid/expired', () => {
    cy.visit('/confirm/email/ThisIsDefinitelyNotAValidToken');
    cy.contains('The confirmation link is invalid or has expired');
  });

  it('can re-send the confirmation email', () => {
    const emailForDoubleConfirmation = randomEmail();

    cy.login({ email: newEmail, redirect: `/dashboard/${user.collective.slug}/advanced` });
    cy.get('[data-cy=EditUserEmailForm] input[name=email]').type(`{selectall}${emailForDoubleConfirmation}`);
    cy.contains('[data-cy=EditUserEmailForm] button', 'Confirm new email').click();
    cy.contains('[data-cy=EditUserEmailForm] button', 'Re-send confirmation').click();
    cy.wait(1000);
    cy.mailpitGetEmailsBySubject(`Confirm your email ${emailForDoubleConfirmation} on Open Collective`).then(result => {
      expect(result).to.have.property('messages');
      expect(result.messages).to.have.length(2);
    });
  });
});
