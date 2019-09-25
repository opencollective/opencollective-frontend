import mockRecaptcha from '../mocks/recaptcha';

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
      cy.contains('Contribute to "Sponsors" tier');
      cy.contains('button', 'Next').click();
      // Ensure we enforce the new URLs
      cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/details');
    });

    it('with /apex/donate/tier/470-sponsors', () => {
      cy.login({ redirect: '/apex/donate/tier/470-sponsors' });
      cy.contains('Contribute to "Sponsors" tier');
      cy.contains('button', 'Next').click();
      // Ensure we enforce the new URLs
      cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/details');
    });
  });

  describe("check when tier doesn't exist", () => {
    it('with /apex/contribute/backer-46999999/checkout', () => {
      const visitParams = { onBeforeLoad: mockRecaptcha, failOnStatusCode: false };
      cy.visit('/apex/contribute/backer-46999999/checkout', visitParams);
      cy.contains('Next step').click();
      cy.contains("Oops! This tier doesn't exist or has been removed by the collective admins.");
      cy.contains('View all the other ways to contribute').click();
      cy.location('pathname').should('eq', '/apex/contribute');
    });
  });

  describe('route resiliance', () => {
    it('with a multipart slug', () => {
      cy.login({ redirect: '/apex/contribute/a-multipart-420-470/checkout' });
      cy.contains('Contribute to "Sponsors" tier');
      cy.contains('button', 'Next').click();
      cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/details');
    });
  });

  it('Can order as new user', () => {
    // Mock clock so we can check next contribution date in a consistent way
    cy.clock(Date.parse('2042/05/25'));

    const userParams = { firstName: 'Order', lastName: 'Tester' };
    const visitParams = { onBeforeLoad: mockRecaptcha };
    cy.signup({ user: userParams, redirect: '/apex/contribute/sponsors-470/checkout', visitParams }).then(user => {
      // ---- Step 1: Select profile ----
      // Personnal account must be the first entry, and it must be checked
      cy.contains('#contributeAs > label:first', `${user.firstName} ${user.lastName}`);
      cy.contains('#contributeAs > label:first', `Personal account - ${user.email}`);
      cy.get('#contributeAs > label:first input[type=radio][name=contributeAs]').should('be.checked');

      // User profile is shown on step, all other steps must be disabled
      cy.get('.step-contributeAs').contains(`${user.firstName} ${user.lastName}`);
      cy.checkStepsProgress({ enabled: 'contributeAs', disabled: ['details', 'payment'] });
      cy.contains('Next step').click();

      // ---- Step 2: Contribute details ----
      cy.checkStepsProgress({ enabled: ['contributeAs', 'details'], disabled: 'payment' });
      // Has default amount selected
      cy.get('#amount button.selected').should('exist');

      // Change amount
      cy.contains('button', '$500').click();
      cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
      cy.contains('.step-details', '$500.00 per month');

      // Frequency must not be disabled
      cy.get('#interval input').should('exist');
      cy.contains('Next charge: Jun 1, 2042');
      cy.contains('Next step').click();

      // ---- Step 3: Payment ----
      cy.checkStepsProgress({ enabled: ['contributeAs', 'details', 'payment'] });
      // As this is a new account, not payment method is configured yet so
      // we should have the credit card form selected by default.
      cy.get('input[type=checkbox][name=save]').should('be.checked');
      cy.wait(1000); // Wait for stripe to be loaded
      cy.fillStripeInput();
      cy.contains('button', 'Make contribution').click();

      // ---- Final: Success ----
      cy.get('#page-order-success', { timeout: 20000 }).contains('$500.00 USD / mo.');
      cy.contains(`${user.firstName} ${user.lastName} is now a member of APEX's "Sponsors" tier!`);
    });
  });

  it('Can order with an existing orgnanization', () => {
    cy.clock(Date.parse('2042/05/25'));
    let collectiveSlug = null;
    const visitParams = { onBeforeLoad: mockRecaptcha };

    cy.login().then(() => {
      // Create a new organization
      cy.createCollective({ type: 'ORGANIZATION' }).then(collective => {
        collectiveSlug = collective.slug;
        // Add a paymentMethod to the organization profile
        cy.addCreditCardToCollective({ collectiveSlug });

        cy.visit('/apex/contribute/sponsors-470/checkout', visitParams);
        // Check the newly created organization
        cy.get(`[type="radio"][name=contributeAs][value=${collective.id}]`).check();
        cy.tick(1000);
        cy.get(`input[type=radio][name=contributeAs][value=${collective.id}]`).should('be.checked');

        cy.contains('Next step').click();

        cy.checkStepsProgress({ enabled: ['contributeAs', 'details'], disabled: 'payment' });
        cy.get('#interval input').should('exist');
        cy.contains('Next charge: Jun 1, 2042');
        cy.contains('Next step').click();
        cy.checkStepsProgress({ enabled: ['contributeAs', 'details', 'payment'] });

        cy.get('#PaymentMethod').then($paymentMethod => {
          // Checks if the organization already has a payment method configured
          if ($paymentMethod.text().includes('VISA **** 4242')) {
            cy.contains('button', 'Make contribution').click();
          } else {
            cy.get('input[type=checkbox][name=save]').should('be.checked');
            cy.wait(1000); // Wait for stripe to be loaded
            cy.fillStripeInput();
            cy.contains('button', 'Make contribution').click();
          }
          cy.get('#page-order-success', { timeout: 20000 }).contains('$100.00 USD / mo.');
          // TestOrg is the name of the created organization.
          cy.contains('TestOrg is now a member of APEX\'s "Sponsors" tier!');
        });
      });
    });
  });
});
