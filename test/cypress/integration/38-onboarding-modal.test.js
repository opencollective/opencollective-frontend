import { randomSlug } from '../support/faker';

describe('Onboarding modal', () => {
  before(() => {
    (process.env.ONBOARDING_MODAL = true), cy.login({ redirect: '/create/community' });
    cy.wait(100);
  });
  it('Edit collective using Onboarding modal', () => {
    cy.get(`input[name="name"]`).type('New collective');
    cy.get(`input[name="slug"]`).type(randomSlug());
    cy.get(`input[name="description"]`).type('short description for new collective');
    cy.get('[data-cy="custom-checkbox"]').click();
    cy.wait(300);
    cy.get('button[type="submit"]').click();
    cy.wait(1000);
    // check if there is Modal with New collective created message
    cy.get('[data-cy="onboarding-collective-created"]').contains('The New collective Collective has been created!');
    cy.get('[data-cy="step-forward-button"]').click();
    // Current count of admins
    cy.get('[data-cy="profile-card"]').children().should('have.length', 1);
    cy.get('[data-cy="admin-picker"]').type('test user{enter}');
    // Profile card should have length 2 since test user is added
    cy.get('[data-cy="profile-card"]').children().should('have.length', 2);
    cy.get('[data-cy="name-of-admins"]').contains('Test User');
    // Delete test user
    cy.get('[data-cy="remove-user"] > button').click();
    // Again the length shoudl be 1
    cy.get('[data-cy="profile-card"]').children().should('have.length', 1);
    cy.get('[data-cy="step-forward-button"]').click();
    // Add Github, Twitter, and website links
    cy.get(`input[name="website"]`).type('opencollective.com/testCollective');
    cy.get(`input[name="twitterHandle"]`).type('testCollective');
    cy.get(`input[name="githubHandle"]`).type('testCollective');
    // Finish creating collective
    cy.get('[data-cy="finish-button"]').click();
    cy.get('[data-cy="welcome-collective"]').contains('Welcome to your new Collective!');
    // close the modal
    cy.get('[data-cy="close-button"]').click();
    // Check if the llink have been added
    cy.get('[data-cy=twitterProfileUrl]').should('have.attr', 'href', 'https://twitter.com/testCollective');
    cy.get('[data-cy=githubProfileUrl]').should('have.attr', 'href', 'https://github.com/testCollective');
    cy.get('[data-cy=collectiveWebsite]').should('have.attr', 'href', 'https://opencollective.com/testCollective');
  });
});
