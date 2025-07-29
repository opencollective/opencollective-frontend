import { randomSlug } from '../support/faker';

function contributeWithNewCard() {
  cy.contains('New payment method').click();
  cy.wait(2000);
  cy.getStripePaymentElement().within(() => {
    cy.get('#Field-numberInput').type('4242424242424242');
    cy.get('#Field-expiryInput').type('1235');
    cy.get('#Field-cvcInput').type('123');
    cy.get('#Field-countryInput').select('US');
    cy.get('#Field-postalCodeInput').type('90210');
  });
  cy.wait(2000);
  cy.get('button[data-cy="cf-next-step"]').click();
}

function getOrderIdFromContributionSuccessPage() {
  return cy
    .get('[data-cy^="contribution-id-"]')
    .invoke('attr', 'data-cy')
    .then(contributionIdStr => {
      const contributionId = parseInt(contributionIdStr.replace('contribution-id-', ''));
      return contributionId;
    });
}

const testConfig = {
  retries: {
    runMode: 2,
    openMode: 0,
  },
};

describe('Contribute Flow: Stripe Payment Element', () => {
  describe('Card', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ skipApproval: true, host: { slug: 'e2e-host' } }).as('collective');
    });

    it('Guest', testConfig, () => {
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(`${randomSlug()}@guest.com`);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewCard();

      cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');
      getOrderIdFromContributionSuccessPage().then(contributionId => {
        cy.waitOrderStatus(contributionId, 'PAID');

        cy.get('@collective').then(col => {
          cy.visit(`${col.slug}/transactions`);
        });

        cy.contains('Financial contribution to TestCollective');
        cy.contains('Credit from Guest to TestCollective');
        cy.contains('Completed');
      });
    });

    it('User', testConfig, () => {
      cy.get('@collective').then(col => {
        cy.signup({ email: `${randomSlug()}+test@opencollective.com`, redirect: `/${col.slug}/donate` });
      });

      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewCard();

      cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');

      getOrderIdFromContributionSuccessPage().then(contributionId => {
        cy.waitOrderStatus(contributionId, 'PAID');

        cy.get('@collective').then(col => {
          cy.visit(`/${col.slug}/donate`);
        });

        cy.contains('Your info').click();
        cy.get('button[data-cy="cf-next-step"]').click();

        cy.contains('VISA **** 4242').click();
        cy.get('button[data-cy="cf-next-step"]').click();
        cy.getByDataCy('order-success', { timeout: 60000 }).contains('Thank you!');

        cy.wait(2000);
        cy.get('@collective').then(col => {
          cy.visit(`${col.slug}/orders`);
        });

        cy.get('[data-cy="order-PAID"]').should('have.length', 2);

        cy.get('@collective').then(col => {
          cy.visit(`${col.slug}/transactions`);
        });

        cy.get('[data-cy="transaction-item"]').should('have.length', 2);
      });
    });
  });

  describe('Redirects', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ skipApproval: true, host: { slug: 'e2e-eur-host' } }).as('collective');
    });

    it('Redirects to trusted url', testConfig, () => {
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate?redirect=https://opencollective.com`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(`${randomSlug()}@guest.com`);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewCard();

      cy.location('origin', { timeout: 60000 }).should('eql', 'https://opencollective.com');
    });

    it('Redirects to untrusted url', testConfig, () => {
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate?redirect=https://google.com`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(`${randomSlug()}@guest.com`);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewCard();

      cy.location('origin', { timeout: 60000 }).should('eql', 'http://localhost:3000');
      cy.location('pathname').should('eql', '/external-redirect');
      cy.contains('Your request is currently being redirected to https://google.com').should('exist');
    });
  });
});
