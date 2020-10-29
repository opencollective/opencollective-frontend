import { defaultTestUserEmail } from '../support/data';
import { randomEmail } from '../support/faker';

describe('Users can change their email address', () => {
  let user = null;
  let newEmail = null;

  before(() => {
    cy.signup({ redirect: '/tos' }).then(u => (user = u));
    cy.clearInbox();
    newEmail = randomEmail();
  });

  it('uses a form in advanced settings', () => {
    // Go to /:collective/edit/advanced
    cy.visit(`/${user.collective.slug}/edit/advanced`);

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
    cy.openEmail(({ subject }) => subject.includes(`Confirm ${newEmail} on Open Collective`));
    cy.contains(`We need to verify that ${newEmail} is your correct address`);
    cy.contains('a', 'Confirm New Email').click();

    // Show loading state
    cy.contains('Validating your email address...');

    // Then ensure we validate the change
    cy.contains('Your email has been changed');
  });

  it('shows an error if validation link is invalid/expired', () => {
    cy.visit('/confirm/email/ThisIsDefinitelyNotAValidToken');
    cy.contains('The confirmation link is invalid or has expired');
  });

  it('can re-send the confirmation email', () => {
    const emailForDoubleConfirmation = randomEmail();

    cy.login({ email: newEmail, redirect: `/${user.collective.slug}/edit/advanced` });
    cy.get('[data-cy=EditUserEmailForm] input[name=email]').type(`{selectall}${emailForDoubleConfirmation}`);
    cy.contains('[data-cy=EditUserEmailForm] button', 'Confirm new email').click();
    cy.contains('[data-cy=EditUserEmailForm] button', 'Re-send confirmation').click();
    cy.wait(1000);
    cy.getInbox().then(emails => {
      const confirmationEmails = emails.filter(({ subject }) =>
        subject.includes(`Confirm ${emailForDoubleConfirmation} on Open Collective`),
      );
      expect(confirmationEmails).to.have.length(2);
    });
  });
});
