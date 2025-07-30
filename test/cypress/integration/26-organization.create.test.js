import mockRecaptcha from '../mocks/recaptcha';
import { randomEmail, randomSlug } from '../support/faker';

describe('create an organization', () => {
  it('creates an organization successfully without co-admin', () => {
    const slug = randomSlug();
    const visitParams = { onBeforeLoad: mockRecaptcha, failOnStatusCode: false };
    cy.login({ redirect: '/signup/organization', visitParams });
    cy.contains('Create Organization');
    cy.get('#input-organization\\.legalName').type('Test Organization Inc.');
    cy.get('#input-organization\\.name').type('Test Organization');
    cy.get('#input-organization\\.slug')
      .should('have.value', 'test-organization')
      .type(`{selectall}test-organization-${slug}`);

    cy.get('#input-organization\\.description').type('short description for new org');
    cy.get('#input-organization\\.website').type('https://www.test.com');
    cy.get('button[type=submit]').click();
    cy.wait(500);
    cy.contains('Welcome, Test Organization!');
  });

  it('creates an organization and a new user', () => {
    const slug = randomSlug();
    const email = randomEmail();
    const visitParams = { onBeforeLoad: mockRecaptcha, failOnStatusCode: false };
    cy.visit('/signup/organization', visitParams);
    cy.contains('Create Organization');

    cy.get('#input-individual\\.name').type('Willem Dafoe');
    cy.get('#input-individual\\.email').type(email);
    cy.getByDataCy('tos-agreement-button').click();

    cy.get('#input-organization\\.legalName').type('Test Organization Inc.');
    cy.get('#input-organization\\.name').type('Test Organization');
    cy.get('#input-organization\\.slug')
      .should('have.value', 'test-organization')
      .type(`{selectall}test-organization-${slug}`);

    cy.get('#input-organization\\.description').type('short description for new org');
    cy.get('#input-organization\\.website').type('https://www.test.com');
    cy.get('button[type=submit]').click();
    cy.wait(500);
    cy.contains('Welcome, Test Organization!');
    cy.contains(
      "Your organization has been successfully created. We've sent you a confirmation email, please proceed from there!",
    );
  });
});
