import { randomSlug } from '../support/faker';

function contributeNewBancontact({ name } = {}) {
  cy.contains('New payment method').click();

  cy.wait(2000);
  cy.getStripePaymentElement().within(() => {
    cy.get('.p-PaymentMethodSelector').then($selector => {
      if ($selector.find('#sbancontact-tab').length) {
        cy.get('#bancontact-tab').click();
      } else {
        cy.get('.p-AdditionalPaymentMethods-menu').select('bancontact');
      }
    });

    if (name) {
      cy.get('#Field-nameInput').type(name);
    }
  });
  cy.wait(1000);
  cy.get('button[data-cy="cf-next-step"]').click();
  cy.contains('a', 'Authorize Test Payment').click();
  cy.wait(3000);
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

      // Stripe recently introduced a JS snippet that has a syntax error, which breaks the tests.
      // Feel free to remove that after some time, see if it's still needed.
      // This event will automatically be unbound when this test ends because it's attached to the cy object.
      cy.origin('https://stripe.com', () => {
        cy.on('uncaught:exception', e => {
          if (e.message.includes("> Unexpected token ')'")) {
            return false;
          }
        });
      });
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
