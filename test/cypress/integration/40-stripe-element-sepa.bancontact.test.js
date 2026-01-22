import { randomSlug } from '../support/faker';

function contributeNewBancontact({ name } = {}) {
  cy.contains('New payment method').click();

  cy.getStripePaymentElement({ timeout: 10000 }).within(() => {
    // Wait for the Bancontact option to be available somewhere
    cy.get(
      '.p-PaymentMethodSelector #bancontact-tab, .p-PaymentMethodSelector .p-AdditionalPaymentMethods-menu select option[value="bancontact"]',
    ).should('have.length.at.least', 1);

    // Prefer clicking the main tab if Bancontact is available there; otherwise, use the additional payment methods menu
    cy.get('.p-PaymentMethodSelector').then($selector => {
      if ($selector.find('#bancontact-tab').length) {
        cy.get('#bancontact-tab').click();
      } else if ($selector.find('.p-AdditionalPaymentMethods-menu select option[value="bancontact"]').length) {
        cy.get('.p-AdditionalPaymentMethods-menu').select('bancontact');
      }
    });

    if (name) {
      cy.get('#Field-nameInput').type(name);
    }
  });
  cy.get('button[data-cy="cf-next-step"]', { timeout: 10000 }).should('be.enabled');
  cy.get('button[data-cy="cf-next-step"]').click();
  cy.contains('a', 'Authorize Test Payment', { timeout: 10000 }).should('be.visible');
  cy.contains('a', 'Authorize Test Payment').click();
  cy.getByDataCy('order-success', { timeout: 60000 }).should('be.visible');
}

const testConfig = {
  retries: {
    runMode: 2,
    openMode: 0,
  },
};

describe('Contribute Flow: Stripe Payment Element', () => {
  describe('Bancontact', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ skipApproval: true, host: { slug: 'e2e-eur-host' } }).as('collective');
    });

    it('Guest', testConfig, () => {
      const email = `${randomSlug()}@guest.com`;
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(email);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeNewBancontact({ name: 'guest user' });

      cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');

      cy.getOrderIdFromContributionSuccessPage().then(contributionId => {
        cy.waitOrderStatus(contributionId, 'PAID');

        cy.get('@collective').then(col => {
          cy.visit(`${col.slug}/orders`);
        });

        cy.contains('Financial contribution to TestCollective');
        cy.contains('Paid');
      });
    });

    it('User', testConfig, () => {
      cy.get('@collective').then(col => {
        cy.signup({ email: `${randomSlug()}+test@opencollective.com`, redirect: `/${col.slug}/donate` });
      });

      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeNewBancontact();

      cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');

      cy.getOrderIdFromContributionSuccessPage().then(contributionId => {
        cy.waitOrderStatus(contributionId, 'PAID');
        cy.get('@collective').then(col => {
          cy.visit(`${col.slug}/orders`);
        });
        cy.contains('Financial contribution to TestCollective');
        cy.contains('Paid');
      });
    });
  });
});
