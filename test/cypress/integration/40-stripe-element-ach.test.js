import { randomSlug } from '../support/faker';

function contributeWithNewUsBankAccount({ name } = {}) {
  cy.contains('New payment method').click();

  cy.wait(2000);
  cy.getStripePaymentElement().within(() => {
    cy.get('#us_bank_account-tab').click();
    if (name) {
      cy.get('#Field-nameInput').type(name);
    }
    cy.contains('Test Institution').click();
  });
  cy.wait(2000);

  cy.get('iframe')
    .first()
    .then(iframe => {
      return iframe.contents().find('body');
    })
    .within(() => {
      cy.get('[data-testid="agree-button"]').click();
      cy.get('[data-testid="success"]').click(); // Bank account with name 'Success'
      cy.get('[data-testid="select-button"]').click();
      cy.get('[data-testid="done-button"]').click();
    });

  cy.wait(3000);
  cy.get('button[data-cy="cf-next-step"]').click();
}

const testConfig = {
  retries: {
    runMode: 2,
    openMode: 0,
  },
};

describe('Contribute Flow: Stripe Payment Element', () => {
  describe('ACH', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ skipApproval: true, host: { slug: 'e2e-host' } }).as('collective');
    });

    it('Guest', testConfig, () => {
      const email = `${randomSlug()}@guest.com`;
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(email);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewUsBankAccount({ name: 'guest user' });

      cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');
      cy.getOrderIdFromContributionSuccessPage().then(contributionId => {
        cy.waitOrderStatus(contributionId, 'PROCESSING|PAID');
      });
    });

    it('User', testConfig, () => {
      cy.get('@collective').then(col => {
        cy.signup({ email: `${randomSlug()}+test@opencollective.com`, redirect: `/${col.slug}/donate` });
      });

      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();
      contributeWithNewUsBankAccount();
      cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');
      cy.getOrderIdFromContributionSuccessPage().then(contributionId => {
        cy.waitOrderStatus(contributionId, 'PROCESSING|PAID');

        cy.get('@collective').then(col => {
          cy.visit(`/${col.slug}/donate`);
        });
        cy.contains('Your info').click();
        cy.get('button[data-cy="cf-next-step"]').click();
        cy.contains('ACH STRIPE TEST BANK ****6789').click();
        cy.get('button[data-cy="cf-next-step"]').click();

        cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');
      });
    });
  });
});
