import { randomSlug } from '../support/faker';

function contributeNewSEPADebit({ name } = {}) {
  cy.contains('New payment method').click();

  cy.wait(2000);
  cy.getStripePaymentElement().within(() => {
    cy.get('.p-PaymentMethodSelector').then($selector => {
      if ($selector.find('#sepa_debit-tab').length) {
        cy.get('#sepa_debit-tab').click();
      } else {
        cy.get('.p-AdditionalPaymentMethods-menu').select('sepa_debit');
      }
    });

    cy.get('#Field-ibanInput').type('FR1420041010050500013M02606');

    if (name) {
      cy.get('#Field-nameInput').type(name);
    }

    cy.get('#Field-countryInput').select('FR');
    cy.get('#Field-addressLine1Input').type('Street');
    cy.get('#Field-postalCodeInput').type('01562');
    cy.get('#Field-localityInput').type('Paris');
  });
  cy.wait(2000);
  cy.get('button[data-cy="cf-next-step"]').click();
  cy.wait(3000);
}

const testConfig = {
  retries: {
    runMode: 2,
    openMode: 0,
  },
};

describe('Contribute Flow: Stripe Payment Element', () => {
  describe('SEPA', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ host: { slug: 'e2e-eur-host' } }).as('collective');
    });

    it('Guest', testConfig, () => {
      const email = `${randomSlug()}@guest.com`;
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
        cy.contains('Your info').click();
        cy.get('input[type="email"]').type(email);
        cy.get('button[data-cy="cf-next-step"]').click();

        contributeNewSEPADebit({ name: 'guest user' });

        cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');

        cy.getOrderIdFromContributionSuccessPage().then(contributionId => {
          cy.waitOrderStatus(contributionId, 'PAID');
          cy.visit(`/${col.slug}/orders`);
          cy.contains('Financial contribution to TestCollective');
          cy.contains('Paid');
        });
      });
    });

    it('User', testConfig, () => {
      cy.get('@collective').then(col => {
        cy.signup({ email: `${randomSlug()}+test@opencollective.com`, redirect: `/${col.slug}/donate` });
      });

      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeNewSEPADebit();

      cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');
      cy.getOrderIdFromContributionSuccessPage().then(contributionId => {
        cy.waitOrderStatus(contributionId, 'PAID');
        cy.get('@collective').then(col => {
          cy.visit(`/${col.slug}/donate`);
        });
        cy.contains('Your info').click();
        cy.get('button[data-cy="cf-next-step"]').click();
        cy.contains('SEPA 20041 ****2606').click();
        cy.get('button[data-cy="cf-next-step"]').click();

        cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');
      });
    });
  });
});
