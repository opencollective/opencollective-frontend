import { randomSlug } from '../support/faker';

const env = Cypress.env('OC_ENV');

describe('apply to host', () => {
  it('as a new collective', () => {
    cy.visit('/brusselstogetherasbl');

    if (env === 'ci') {
      // Can easily change on local dev setup, so only checked on CI
      cy.contains('We are fiscally hosting 2 Collectives');
    }

    cy.get('[data-cy="host-apply-btn"]:visible').click();
    cy.getByDataCy('host-apply-collective-picker').click();
    cy.getByDataCy('host-apply-new-collective-link').click();
    cy.get('#email').type('testuser@opencollective.com');
    cy.wait(500);
    cy.getByDataCy('signin-btn').click();
    cy.get(`input[name="name"]`).type('New collective');
    cy.get(`input[name="slug"]`).type(randomSlug());
    cy.get(`input[name="description"]`).type('short description for new collective');
    cy.getByDataCy('checkbox-tos').click();
    cy.wait(300);
    cy.get('button[type="submit"]').click();
    cy.wait(1000);
    cy.get('[data-cy="collective-title"]', { timeout: 10000 }).contains('New collective');
    cy.url().then(currentUrl => {
      const collectiveId = currentUrl.match(/CollectiveId=([0-9]+)/)[1];
      cy.login({ redirect: `/brusselstogetherasbl/dashboard/pending-applications#application-${collectiveId}` });
      cy.contains(`#application-${collectiveId} button`, 'Approve').click();
      cy.contains(`#application-${collectiveId}`, 'Approved');
    });
  });
});
