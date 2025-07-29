import { randomSlug } from '../support/faker';

const env = Cypress.env('OC_ENV');

describe('apply to host', () => {
  it('as a new collective', () => {
    cy.visit('/brusselstogetherasbl');

    if (env === 'ci') {
      // Can easily change on local dev setup, so only checked on CI
      cy.contains('We are fiscally hosting 2 Collectives');
    }
    const collectiveSlug = randomSlug();
    cy.get('[data-cy="host-apply-btn"]:visible').click();
    cy.getByDataCy('host-apply-modal-next').click();
    cy.getByDataCy('host-apply-collective-picker').click();
    cy.getByDataCy('host-apply-new-collective-link').click();
    cy.get('#email').type('testuser@opencollective.com');
    cy.wait(500);
    cy.getByDataCy('signin-btn').click();
    cy.get(`input[name="name"]`).type('New collective');
    cy.get(`input[name="slug"]`).type(`{selectall}${collectiveSlug}`);
    cy.get(`input[name="description"]`).type('short description for new collective');
    cy.getByDataCy('checkbox-tos').click();
    cy.wait(300);
    cy.get('button[type="submit"]').click();
    cy.wait(1000);
    cy.get('[data-cy="collective-title"]', { timeout: 10000 }).contains('New collective');
    cy.url().then(currentUrl => {
      const collectiveId = currentUrl.match(/CollectiveId=([0-9]+)/)[1];
      cy.login({ redirect: `/dashboard/brusselstogetherasbl/host-applications#application-${collectiveId}` });
      cy.contains('Pending').click();
      cy.get(`[data-cy="${collectiveSlug}-table-actions"]`).click();
      cy.get(`[data-cy="${collectiveSlug}-view-details"]`).click();
      cy.get(`[data-cy="${collectiveSlug}-approve"]`).click();
      cy.contains(`[data-cy="host-application-header-${collectiveSlug}"]`, 'Approved');
    });
  });
});
