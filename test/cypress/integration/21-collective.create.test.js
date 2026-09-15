// Updated by Cypress Author on 2026-09-15.
import { randomEmail, randomSlug } from '../support/faker';

const fillCollectiveForm = ({ name, description }) => {
  cy.getByDataCy('ccf-category-picker-button-community').click();
  cy.getByDataCy('ccf-form-name').type(name);
  cy.getByDataCy('ccf-form-description').type(description);
};

const submitCollectiveForm = () => {
  cy.getByDataCy('custom-checkbox').click();
  cy.getByDataCy('ccf-form-submit').click();
};

describe('create a collective', () => {
  beforeEach(() => {
    const userEmail = randomEmail();
    cy.signup({ user: { email: userEmail }, redirect: '/create' });
    cy.wrap(userEmail).as('userEmail');
  });

  it('submits the collective form → opens onboarding for the new collective', () => {
    const uniqueId = randomSlug();
    const collectiveName = `Bees are neat ${uniqueId}`;
    const collectiveSlug = `bees-are-neat-${uniqueId}`;

    fillCollectiveForm({ name: collectiveName, description: 'We are going to save the bees' });
    cy.getByDataCy('ccf-form-slug').first().find('input').invoke('val').should('equal', collectiveSlug);
    submitCollectiveForm();
    cy.location('pathname').should('equal', `/${collectiveSlug}/onboarding`);
  });

  it('submits an existing slug → shows a validation error', () => {
    const collectiveSlug = `bees-are-neat-${randomSlug()}`;

    cy.get('@userEmail').then(email => {
      cy.createCollective({ type: 'COLLECTIVE', email, name: 'Existing bee collective', slug: collectiveSlug });
    });

    fillCollectiveForm({ name: 'Bees are neat', description: 'I just really like them' });
    cy.getByDataCy('ccf-form-slug').first().find('input').clear();
    cy.getByDataCy('ccf-form-slug').first().find('input').type(collectiveSlug);
    submitCollectiveForm();
    cy.getByDataCy('ccf-error-message').should(
      'contain',
      'An account already exists for this URL, please choose another one.',
    );
  });

  it('creates a collective with tags → displays its tags on the collective page', () => {
    const uniqueId = randomSlug();
    const collectiveSlug = `bees-are-vicious-${uniqueId}`;
    const randomTag = randomSlug();

    fillCollectiveForm({ name: `Bees are vicious ${uniqueId}`, description: 'I do not like them' });
    cy.getByDataCy('tags-select').click();
    cy.getByDataCy('tags-select-option-meetup').click();
    cy.getByDataCy('tags-select-input').type(`${randomTag}{enter}{esc}`, { delay: 750 });
    cy.getByDataCy('ccf-form-tags').should('contain', randomTag);
    submitCollectiveForm();
    cy.location('pathname').should('equal', `/${collectiveSlug}/onboarding`);
    cy.visit(`/${collectiveSlug}`);
    cy.getByDataCy('collective-tags').should('contain', randomTag);
    cy.getByDataCy('collective-tags').should('contain', 'meetup');
    cy.getByDataCy('collective-tags').should('contain', 'COLLECTIVE');
  });
});
