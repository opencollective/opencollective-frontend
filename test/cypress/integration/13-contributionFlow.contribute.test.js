import mockRecaptcha from '../mocks/recaptcha';
import { randomSlug } from '../support/faker';

/**
 * Test the order flow - AKA the contribution flow with a tier selected.
 *
 * We don't test for validations here as it is already done
 * in `12-contributionFlow.donate.test`.
 */
describe('Contribution Flow: Order', () => {
  describe('works with legacy routes', () => {
    // The routes changed in https://github.com/opencollective/opencollective-frontend/pull/1876
    // This test ensure that we still support the old routes schemes. After some time
    // and if the logs confirm that these routes are not used anymore, it will be
    // safe to delete these tests.
    it('with /apex/contribute/tier/470-sponsors', () => {
      cy.login({ redirect: '/apex/donate/tier/470-sponsors' });
      cy.contains('Contribution details');
      cy.get('button[data-cy="cf-next-step"]').click();
      // Ensure we enforce the new URLs
      cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/profile');
    });

    it('with /apex/donate/tier/470-sponsors', () => {
      cy.login({ redirect: '/apex/donate/tier/470-sponsors' });
      cy.contains('Contribution details');
      cy.get('button[data-cy="cf-next-step"]').click();
      // Ensure we enforce the new URLs
      cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/profile');
    });
  });

  describe("check when tier doesn't exist", () => {
    it('with /apex/contribute/backer-46999999/checkout', () => {
      const visitParams = { onBeforeLoad: mockRecaptcha, failOnStatusCode: false };
      const routeBase = '/apex/contribute';
      cy.visit(`${routeBase}/backer-46999999/checkout`, visitParams);
      cy.contains("Oops! This tier doesn't exist or has been removed by the collective admins.");
      cy.contains('View all the other ways to contribute').click();
      cy.location('pathname').should('eq', '/apex/contribute');
    });
  });

  describe('route resilience', () => {
    it('with a multipart slug', () => {
      cy.login({ redirect: '/apex/contribute/a-multipart-420-470/checkout' });
      cy.contains('Contribution details');
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/profile');
    });
  });

  it('Can order as new user', () => {
    const userParams = { name: 'Order Tester' };
    const visitParams = { onBeforeLoad: mockRecaptcha };
    const routeBase = '/apex/contribute';

    cy.signup({ user: userParams, redirect: `${routeBase}/sponsors-470/checkout`, visitParams }).then(() => {
      // ---- Step Details ----
      cy.checkStepsProgress({ enabled: ['details'], disabled: ['profile', 'payment'] });

      // Mock clock so we can check next contribution date in a consistent way
      cy.clock(Date.parse('2042/05/03'));

      // Has default amount selected
      cy.get('#amount button.selected').should('exist');

      // Change amount
      cy.contains('button', '$500').click();
      cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
      cy.contains('[data-cy="progress-step-details"]', '$500.00 USD / mo.');

      // Frequency must not be disabled
      cy.contains('button', '$100').should('not.be.disabled');
      cy.contains('the next charge will be on June 1, 2042');
      cy.get('button[data-cy="cf-next-step"]').click();

      // ---- Step Profile ----
      cy.checkStepsProgress({ enabled: ['details', 'profile'], disabled: 'payment' });

      // Personal account must be the first entry, and it must be checked
      const userName = userParams.name;
      cy.contains('[data-cy="contribute-profile-picker"]', userName);
      cy.getByDataCy('contribute-profile-picker').click();
      cy.contains('[data-cy="select-option"]:first', userName);
      cy.getByDataCy('progress-step-profile').contains(userName);
      cy.get('body').type('{esc}');

      // Country required since we're contributing > $500
      cy.getByDataCy('country-select').click();
      cy.contains('[data-cy="select-option"]', 'Algeria').click();
      cy.get('input[data-cy="address-address1"]').type('Street Name, 123');
      cy.get('input[data-cy="address-postalCode"]').type('123');
      cy.get('input[data-cy="address-city"]').type('Citycitycity');
      cy.get('button[data-cy="cf-next-step"]').click();

      // ---- Step 3: Payment ----
      cy.checkStepsProgress({ enabled: ['profile', 'details', 'payment'] });
      // As this is a new account, not payment method is configured yet so
      // we should have the credit card form selected by default.
      cy.get('input[type=checkbox][name=save]').should('be.checked');
      cy.wait(1000); // Wait for stripe to be loaded
      cy.fillStripeInput();
      cy.contains('button', 'Contribute $500').click();

      // ---- Final: Success ----
      cy.getByDataCy('order-success', { timeout: 20000 }).contains('$500.00 USD / month');
      cy.contains(`You are now supporting APEX.`);
      cy.contains(`APEX - Sponsors`);
    });
  });

  it('Can order with an existing organization', () => {
    let collectiveSlug = null;
    const visitParams = { onBeforeLoad: mockRecaptcha };
    const routeBase = '/apex/contribute';

    cy.login().then(() => {
      // Create a new organization
      cy.createCollective({ type: 'ORGANIZATION', name: randomSlug() }).then(collective => {
        collectiveSlug = collective.slug;

        cy.clock(Date.parse('2042/05/03'));

        // Add a paymentMethod to the organization profile
        cy.addCreditCardToCollective({ collectiveSlug });

        cy.visit(`${routeBase}/sponsors-470/checkout`, visitParams);

        // Details
        cy.contains('button', '$100').should('not.be.disabled');
        cy.contains('the next charge will be on June 1, 2042');
        cy.get('#amount > :nth-child(1)').click();
        cy.getByDataCy('cf-next-step').click();

        // Profile
        cy.checkStepsProgress({ enabled: ['profile', 'details'], disabled: 'payment' });
        cy.getByDataCy('contribute-profile-picker').click();
        cy.contains('[data-cy="select-option"]', collective.name).click();

        // Payment
        cy.getByDataCy('cf-next-step').click();
        cy.checkStepsProgress({ enabled: ['profile', 'details', 'payment'] });
        cy.contains('Next charge date: June 1, 2042');
        cy.get('#PaymentMethod').then($paymentMethod => {
          // Checks if the organization already has a payment method configured
          if ($paymentMethod.text().includes('VISA **** 4242')) {
            cy.contains('button', 'Contribute $').click();
          } else {
            cy.get('input[type=checkbox][name=save]').should('be.checked');
            cy.wait(1000); // Wait for stripe to be loaded
            cy.fillStripeInput();
            cy.contains('button', 'Contribute $100').click();
          }
          cy.getByDataCy('order-success', { timeout: 20000 }).contains('$100.00 USD / mont');
          cy.contains(`You are now supporting APEX.`);
          cy.contains(`APEX - Sponsors`);
        });
      });
    });
  });
});
