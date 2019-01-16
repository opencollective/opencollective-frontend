import { randomEmail } from '../support/faker';

describe('Contribution Flow: Sign In', () => {
  const validUserEmail = randomEmail();

  before(() => {
    cy.createCollective({ type: 'USER', email: validUserEmail });
  });

  it("Doesn't allow to submit if email is invalid", () => {
    cy.visit('/apex/donate');
    cy.get('#content input[name=email]').type('zzzzzzzzzzzzz');
    cy.get('#content button[type=submit]').should('be.disabled');
    cy.get('#content button[type=submit]').focus();
    cy.contains("Please include an '@' in the email address. 'zzzzzzzzzzzzz' is missing an '@'.");
  });

  it("Shows a warning when email doesn't exist", () => {
    cy.visit('/apex/donate');
    cy.get('#content input[name=email]').type(randomEmail());
    cy.get('#content button[type=submit]').click();
    cy.contains('There is no user with this email address. Join for free!');
  });

  it('Works if given a valid email', () => {
    cy.visit('/apex/donate');
    cy.get('#content input[name=email]').type(validUserEmail);
    cy.get('#content button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${validUserEmail}.`);
  });
});
