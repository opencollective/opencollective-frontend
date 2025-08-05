import { randomEmail, randomSlug } from '../support/faker';

describe('Onboarding modal', () => {
  before(() => {
    cy.login({ redirect: '/create/community' });
  });
  it('Edit collective using Onboarding modal', () => {
    const invitedUserEmail = randomEmail();
    cy.get(`input[name="name"]`).type('New collective');
    cy.get(`input[name="slug"]`).type(randomSlug());
    cy.get(`input[name="description"]`).type('short description for new collective');
    cy.get('[data-cy="custom-checkbox"]').click();
    cy.get('button[type="submit"]').click();
    // check if there is Modal with New collective created message
    cy.get('[data-cy="onboarding-collective-created"]').contains('New collective has been created!');
    cy.get('[data-cy="step-forward-button"]').click();
    // Current count of admins
    cy.get('[data-cy="profile-card"]').children().should('have.length', 1);
    cy.get('[data-cy="admin-picker"]').click();
    cy.getByDataCy('collective-type-picker-USER').click();
    cy.get('[data-cy="create-collective-mini-form"] input[name="email"]').type(invitedUserEmail);
    cy.get('[data-cy="create-collective-mini-form"] input[name="name"]').type('AmazingNewUser');
    cy.get('[data-cy="create-collective-mini-form"] button[type="submit"]').click();
    // Profile card should have length 2 since test user is added
    cy.get('[data-cy="profile-card"]').children().should('have.length', 2);
    cy.get('[data-cy="name-of-admins"]').contains('AmazingNewUser');
    // Delete test user
    cy.get('[data-cy="remove-user"] > button').click();
    // Again the length should be 1
    cy.get('[data-cy="profile-card"]').children().should('have.length', 1);
    cy.get('[data-cy="step-forward-button"]').click();
    // Add Github, Twitter, and website links
    cy.contains('Add social link').click();
    cy.getByDataCy('social-link-inputs');
    cy.focused().type('https://opencollective.com/testCollective');
    cy.contains('Add social link').click();
    cy.focused().type('https://twitter.com/testCollective');
    cy.contains('Add social link').click();
    cy.focused().type('https://github.com/testCollective');
    // Finish creating collective
    cy.get('[data-cy="finish-button"]').click();
    cy.get('[data-cy="welcome-collective"]').contains('Welcome to your new Collective!');
    // close the modal
    cy.get('[data-cy="close-button"]').click();
    // Check if the link have been added
    cy.get('a[rel~=me]')
      .first()
      .should('have.attr', 'href', 'https://opencollective.com/testCollective')
      .next()
      .should('have.attr', 'href', 'https://twitter.com/testCollective')
      .next()
      .should('have.attr', 'href', 'https://github.com/testCollective');
  });
});
