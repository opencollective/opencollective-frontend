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
  cy.get('button[data-cy="cf-next-step"]').click();
}

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
      cy.contains('Agree').click();
      cy.contains('Success').click(); // Bank account with name 'Success'
      cy.contains('Link account').click();
      cy.get('[data-testid="done-button"]').click();
    });

  cy.wait(3000);
  cy.get('button[data-cy="cf-next-step"]').click();
}

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
  cy.get('button[data-cy="cf-next-step"]').click();
  cy.wait(3000);
}

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
  cy.contains('Authorize Test Payment').click();
  cy.wait(3000);
}

describe('Contribute Flow: Stripe Payment Element', () => {
  describe('Card', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ host: { slug: 'e2e-host' } }).as('collective');
    });

    it('Guest', () => {
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(`${randomSlug()}@guest.com`);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewCard();

      cy.getByDataCy('order-success').contains('Thank you!');

      cy.wait(3000);
      cy.get('@collective').then(col => {
        cy.visit(`${col.slug}/orders`);
      });

      cy.contains('Financial contribution to TestCollective');
      cy.contains('for TestCollective from Guest');
      cy.contains('Paid');

      cy.get('@collective').then(col => {
        cy.visit(`${col.slug}/transactions`);
      });

      cy.contains('Financial contribution to TestCollective');
      cy.contains('Credit from Guest to TestCollective');
      cy.contains('Completed');
    });

    it('User', () => {
      cy.get('@collective').then(col => {
        cy.signup({ email: `${randomSlug()}+test@opencollective.com`, redirect: `/${col.slug}/donate` });
      });

      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewCard();

      cy.getByDataCy('order-success').contains('Thank you!');

      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });

      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();

      cy.contains('VISA **** 4242').click();
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.getByDataCy('order-success').contains('Thank you!');

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

  describe('ACH', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ host: { slug: 'e2e-host' } }).as('collective');
    });

    it('Guest', () => {
      const email = `${randomSlug()}@guest.com`;
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(email);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewUsBankAccount({ name: 'guest user' });

      cy.getByDataCy('order-success').contains('Thank you!');

      cy.get('@collective').then(col => {
        cy.visit(`${col.slug}/orders`);
      });

      cy.contains('Financial contribution to TestCollective');
      cy.contains('Processing');
    });

    it('User', () => {
      cy.get('@collective').then(col => {
        cy.signup({ email: `${randomSlug()}+test@opencollective.com`, redirect: `/${col.slug}/donate` });
      });

      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();
      contributeWithNewUsBankAccount();
      cy.getByDataCy('order-success').contains('Thank you!');
      cy.wait(10000);

      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });
      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.contains('ACH STRIPE TEST BANK ****6789').click();
      cy.get('button[data-cy="cf-next-step"]').click();

      cy.getByDataCy('order-success').contains('Thank you!');
    });
  });

  describe('SEPA', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ host: { slug: 'e2e-eur-host' } }).as('collective');
    });

    it('Guest', () => {
      const email = `${randomSlug()}@guest.com`;
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(email);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeNewSEPADebit({ name: 'guest user' });

      cy.getByDataCy('order-success').contains('Thank you!');
      cy.wait(10000);

      cy.get('@collective').then(col => {
        cy.visit(`${col.slug}/orders`);
      });

      cy.contains('Financial contribution to TestCollective');
      cy.contains('Paid');
    });

    it('User', () => {
      cy.get('@collective').then(col => {
        cy.signup({ email: `${randomSlug()}+test@opencollective.com`, redirect: `/${col.slug}/donate` });
      });

      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeNewSEPADebit();

      cy.getByDataCy('order-success').contains('Thank you!');
      cy.wait(10000);

      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });
      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.contains('SEPA 20041 ****2606').click();
      cy.get('button[data-cy="cf-next-step"]').click();

      cy.getByDataCy('order-success').contains('Thank you!');
    });
  });

  describe('Bancontact', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ host: { slug: 'e2e-eur-host' } }).as('collective');
    });

    it('Guest', () => {
      const email = `${randomSlug()}@guest.com`;
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(email);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeNewBancontact({ name: 'guest user' });

      cy.getByDataCy('order-success').contains('Thank you!');
      cy.wait(10000);

      cy.get('@collective').then(col => {
        cy.visit(`${col.slug}/orders`);
      });

      cy.contains('Financial contribution to TestCollective');
      cy.contains('Paid');
    });

    it('User', () => {
      cy.get('@collective').then(col => {
        cy.signup({ email: `${randomSlug()}+test@opencollective.com`, redirect: `/${col.slug}/donate` });
      });

      cy.contains('Your info').click();
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeNewBancontact();

      cy.getByDataCy('order-success').contains('Thank you!');
      cy.wait(10000);

      cy.get('@collective').then(col => {
        cy.visit(`${col.slug}/orders`);
      });

      cy.contains('Financial contribution to TestCollective');
      cy.contains('Paid');
    });
  });

  describe('Redirects', () => {
    beforeEach(() => {
      cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
        req.continue(res => {
          res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
        });
      });

      cy.createCollectiveV2({ host: { slug: 'e2e-eur-host' } }).as('collective');
      cy.clearCookies();
      cy.clearLocalStorage();
    });

    it('Redirects to trusted url', () => {
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate?redirect=https://opencollective.com`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(`${randomSlug()}@guest.com`);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewCard();

      cy.location('origin').should('eql', 'https://opencollective.com');
    });

    it('Redirects to untrusted url', () => {
      cy.get('@collective').then(col => {
        cy.visit(`/${col.slug}/donate?redirect=https://google.com`);
      });

      cy.contains('Your info').click();
      cy.get('input[type="email"]').type(`${randomSlug()}@guest.com`);
      cy.get('button[data-cy="cf-next-step"]').click();

      contributeWithNewCard();

      cy.location('origin').should('eql', 'http://localhost:3000');
      cy.location('pathname').should('eql', '/external-redirect');
      cy.contains('Your request is currently being redirected to https://google.com').should('exist');
    });
  });
});
