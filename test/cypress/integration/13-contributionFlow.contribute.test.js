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

  describe('route resiliance', () => {
    it('with a multipart slug', () => {
      cy.login({ redirect: '/apex/contribute/a-multipart-420-470/checkout' });
      cy.contains('Contribution details');
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/profile');
    });
  });

  it('Can order as new user', () => {
    const userParams = { firstName: 'Order', lastName: 'Tester' };
    const visitParams = { onBeforeLoad: mockRecaptcha };
    const routeBase = '/apex/contribute';

    cy.waitUntil(() =>
      cy.signup({ user: userParams, redirect: `${routeBase}/sponsors-470/checkout`, visitParams }).then(user => {
        // Mock clock so we can check next contribution date in a consistent way
        cy.clock(Date.parse('2042/05/03'));

        // ---- Step Details ----
        cy.checkStepsProgress({ enabled: ['details'], disabled: ['profile', 'payment'] });
        // Has default amount selected
        cy.get('#amount button.selected').should('exist');

        // Change amount
        cy.contains('button', '$500').click();
        cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
        cy.contains('[data-cy="progress-step-details"]', '$500.00 USD / month');

        // Frequency must not be disabled
        cy.contains('#interval button').should('not.be.disabled');
        cy.contains('Next charge on June 1, 2042');
        cy.get('button[data-cy="cf-next-step"]').click();

        // ---- Step Profile ----
        cy.checkStepsProgress({ enabled: ['details', 'profile'], disabled: 'payment' });
        // Personnal account must be the first entry, and it must be checked
        cy.contains('[data-cy="ContributionProfile"] > label:first', `${user.firstName} ${user.lastName}`);
        cy.contains('[data-cy="ContributionProfile"] > label:first', user.email);
        cy.get('[data-cy="ContributionProfile"] > label:first input[type=radio]').should('be.checked');

        cy.getByDataCy('progress-step-profile').contains(`${user.firstName} ${user.lastName}`);
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
      }),
    );
  });

  it('Can order with an existing orgnanization', () => {
    let collectiveSlug = null;
    const visitParams = { onBeforeLoad: mockRecaptcha };
    const routeBase = '/apex/contribute';

    cy.login().then(() => {
      // Create a new organization
      cy.createCollective({ type: 'ORGANIZATION' }).then(collective => {
        collectiveSlug = collective.slug;

        cy.clock(Date.parse('2042/05/03'));

        // Add a paymentMethod to the organization profile
        cy.addCreditCardToCollective({ collectiveSlug });

        cy.visit(`${routeBase}/sponsors-470/checkout`, visitParams);

        // Details
        cy.contains('#interval button').should('not.be.disabled');
        cy.contains('Next charge on June 1, 2042');
        cy.get('#amount > :nth-child(1)').click();
        cy.getByDataCy('cf-next-step').click();

        // Profile
        cy.checkStepsProgress({ enabled: ['profile', 'details'], disabled: 'payment' });
        cy.get(`[type="radio"][name=ContributionProfile][value=${collective.id}]`).check();
        cy.tick(1000);
        cy.get(`input[type=radio][name=ContributionProfile][value=${collective.id}]`).should('be.checked');

        // Payment
        cy.getByDataCy('cf-next-step').click();
        cy.checkStepsProgress({ enabled: ['profile', 'details', 'payment'] });

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
