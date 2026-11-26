// Moved from 04-collective.test.js when the rest of that file migrated to Playwright
// (test/playwright/specs/collectives/). It pays with a live Stripe test card, so it stays in Cypress until the
// Stripe journeys migrate.
import { Sections } from '../../../components/collective-page/_constants';

import mockRecaptcha from '../mocks/recaptcha';

const scrollToSection = section => {
  // Wait for collective page to load before disabling smooth scroll
  cy.get('[data-cy=collective-page-main]');
  cy.get(`#section-${section}`).scrollIntoView();
};

describe('Edit public message after contribution', () => {
  it('can edit public message', () => {
    cy.createHostedCollective().then(({ slug }) => {
      /** Make a donation by a new user */
      cy.signup({ redirect: `/${slug}/donate`, visitParams: { onBeforeLoad: mockRecaptcha } }).then(() => {
        // SECTION: Make a donation to the collective
        cy.get('button[data-cy="cf-next-step"]').click();
        cy.contains('Contribute as').should('be.visible');
        cy.get('button[data-cy="cf-next-step"]').click();
        cy.wait(2000); // Wait for stripe to be loaded
        cy.fillStripeInput();
        cy.contains('button', 'Contribute').click();
        cy.wait(1000); // It takes a little bit of time to create the order.
        // Wait for the order to succeed
        cy.getByDataCy('order-success', { timeout: 20000 });

        // SECTION: Go to the collective page and change the public message
        cy.visit(`/${slug}#${Sections.CONTRIBUTORS}`);
        /** Cypress can't find the public message text unless we do this.
         * Probably related to this issue: https://github.com/cypress-io/cypress/issues/695
         */
        cy.wait(1000);
        scrollToSection(Sections.CONTRIBUTORS);
        cy.get('[data-cy=ContributorCard_EditPublicMessageButton]').click();
        const publicMessage = 'Writing a long public message!';
        cy.get('[data-cy=EditPublicMessagePopup]').within(() => {
          cy.get('textarea').type(publicMessage);
          cy.get('[data-cy=EditPublicMessagePopup_SubmitButton]').click();
        });
        cy.get('[data-cy=EditPublicMessagePopup]').should('not.exist');
        cy.contains('[data-cy=ContributorsGrid_ContributorCard]', publicMessage);
        cy.reload();
        // Makes sure the cache in the backend was deleted.
        cy.contains('[data-cy=ContributorsGrid_ContributorCard]', publicMessage);
      });
    });
  });
});
