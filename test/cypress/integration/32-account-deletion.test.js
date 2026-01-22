import mockRecaptcha from '../mocks/recaptcha';
import { randomSlug } from '../support/faker';

describe('Account Deletion', () => {
  let collectiveSlug = null;

  before(() => {
    cy.createCollective({ type: 'COLLECTIVE' }).then(({ slug }) => {
      collectiveSlug = slug;
    });
    cy.login({ redirect: `/dashboard/${collectiveSlug}/advanced` });
  });

  it('Should delete collective', () => {
    cy.visit(`/dashboard/${collectiveSlug}/advanced`);
    cy.contains('button', 'Delete this Collective', { timeout: 15000 }).click();
    cy.get('[data-cy=delete]').click();
    cy.location('search', { timeout: 10000 }).should('eq', '?type=COLLECTIVE');
    cy.location().should(location => {
      expect(location.search).to.eq('?type=COLLECTIVE');
    });
    cy.contains('h1', 'Your collective has been deleted.');
  });

  it('Should delete user', () => {
    const userSlug = randomSlug();
    const userParams = { name: userSlug };
    const visitParams = { onBeforeLoad: mockRecaptcha };

    cy.signup({ user: userParams, visitParams, redirect: `/dashboard/${userSlug}/advanced` });
    cy.contains('button', 'Delete this account').click();
    cy.get('[data-cy=delete]').click();
    cy.location('search', { timeout: 10000 }).should('eq', '?type=USER');
    cy.location().should(location => {
      expect(location.search).to.eq('?type=USER');
    });
    cy.contains('h1', 'Your account has been deleted.');
  });
});
