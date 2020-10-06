import mockRecaptcha from '../mocks/recaptcha';

const isNewContributionFlow = Cypress.env('NEW_CONTRIBUTION_FLOW');

/**
 * Test the order flow - AKA the contribution flow with a tier selected.
 *
 * We don't test for validations here as it is already done
 * in `12-contributionFlow.donate.test`.
 */
describe('Contribution Flow: Order', () => {
  describe('New flow', () => {
    // Can only be tested if the new flow is the default. Adding support for this test when
    // using the Beta routes would intoduce too much complexity.
    if (isNewContributionFlow) {
      describe('works with legacy routes', () => {
        // The routes changed in https://github.com/opencollective/opencollective-frontend/pull/1876
        // This test ensure that we still support the old routes schemes. After some time
        // and if the logs confirm that these routes are not used anymore, it will be
        // safe to delete these tests.
        it('with /apex/contribute/tier/470-sponsors', () => {
          cy.login({ redirect: '/apex/donate/tier/470-sponsors' });
          cy.contains('Contribution details');
          cy.contains('button', 'Next').click();
          // Ensure we enforce the new URLs
          cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/profile');
        });

        it('with /apex/donate/tier/470-sponsors', () => {
          cy.login({ redirect: '/apex/donate/tier/470-sponsors' });
          cy.contains('Contribution details');
          cy.contains('button', 'Next').click();
          // Ensure we enforce the new URLs
          cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/profile');
        });
      });
    }

    describe("check when tier doesn't exist", () => {
      it('with /apex/contribute/backer-46999999/checkout', () => {
        const visitParams = { onBeforeLoad: mockRecaptcha, failOnStatusCode: false };
        const routeBase = isNewContributionFlow ? '/apex/contribute' : '/apex/new-contribute';
        cy.visit(`${routeBase}/backer-46999999/checkout`, visitParams);
        cy.contains('Next step').click();
        cy.contains("Oops! This tier doesn't exist or has been removed by the collective admins.");
        cy.contains('View all the other ways to contribute').click();
        cy.location('pathname').should('eq', '/apex/contribute');
      });
    });

    if (isNewContributionFlow) {
      describe('route resiliance', () => {
        it('with a multipart slug', () => {
          cy.login({ redirect: '/apex/contribute/a-multipart-420-470/checkout' });
          cy.contains('Contribution details');
          cy.contains('button', 'Next').click();
          cy.location('pathname').should('eq', '/apex/contribute/sponsors-470/checkout/profile');
        });
      });
    }

    it('Can order as new user', () => {
      const userParams = { firstName: 'Order', lastName: 'Tester' };
      const visitParams = { onBeforeLoad: mockRecaptcha };
      const routeBase = isNewContributionFlow ? '/apex/contribute' : '/apex/new-contribute';

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
          cy.contains('Next step').click();

          // ---- Step Profile ----
          cy.checkStepsProgress({ enabled: ['details', 'profile'], disabled: 'payment' });
          // Personnal account must be the first entry, and it must be checked
          cy.contains('[data-cy="ContributionProfile"] > label:first', `${user.firstName} ${user.lastName}`);
          cy.contains('[data-cy="ContributionProfile"] > label:first', user.email);
          cy.get('[data-cy="ContributionProfile"] > label:first input[type=radio]').should('be.checked');

          cy.getByDataCy('progress-step-profile').contains(`${user.firstName} ${user.lastName}`);
          cy.contains('Next step').click();

          // ---- Step 3: Payment ----
          cy.checkStepsProgress({ enabled: ['profile', 'details', 'payment'] });
          // As this is a new account, not payment method is configured yet so
          // we should have the credit card form selected by default.
          cy.get('input[type=checkbox][name=save]').should('be.checked');
          cy.wait(1000); // Wait for stripe to be loaded
          cy.fillStripeInput();
          cy.contains('button', 'Make contribution').click();

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
      const routeBase = isNewContributionFlow ? '/apex/contribute' : '/apex/new-contribute';

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
              cy.contains('button', 'Make contribution').click();
            } else {
              cy.get('input[type=checkbox][name=save]').should('be.checked');
              cy.wait(1000); // Wait for stripe to be loaded
              cy.fillStripeInput();
              cy.contains('button', 'Make contribution').click();
            }
            cy.getByDataCy('order-success', { timeout: 20000 }).contains('$100.00 USD / mont');
            cy.contains(`You are now supporting APEX.`);
            cy.contains(`APEX - Sponsors`);
          });
        });
      });
    });
  });

  if (!isNewContributionFlow) {
    describe('Old flow', () => {
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
        const userParams = { firstName: 'Order', lastName: 'Tester' };
        const visitParams = { onBeforeLoad: mockRecaptcha };
        cy.signup({ user: userParams, redirect: '/apex/contribute/sponsors-470/checkout', visitParams }).then(user => {
          // Mock clock so we can check next contribution date in a consistent way
          cy.clock(Date.parse('2042/05/03'));

          // ---- Step 1: Select profile ----
          // Personnal account must be the first entry, and it must be checked
          cy.contains('[data-cy="ContributionProfile"] > label:first', `${user.firstName} ${user.lastName}`);
          cy.contains('[data-cy="ContributionProfile"] > label:first', `Personal account - ${user.email}`);
          cy.get('[data-cy="ContributionProfile"] > label:first input[type=radio][name=contributeAs]').should(
            'be.checked',
          );

          // User profile is shown on step, all other steps must be disabled
          cy.getByDataCy('progress-step-contributeAs').contains(`${user.firstName} ${user.lastName}`);
          cy.checkStepsProgress({ enabled: 'contributeAs', disabled: ['details', 'payment'] });
          cy.contains('Next step').click();

          // ---- Step 2: Contribute details ----
          cy.checkStepsProgress({ enabled: ['contributeAs', 'details'], disabled: 'payment' });
          // Has default amount selected
          cy.get('#amount button.selected').should('exist');

          // Change amount
          cy.contains('button', '$500').click();
          cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
          cy.contains('[data-cy="progress-step-details"]', '$500.00 per month');

          // Frequency must not be disabled
          cy.get('#interval input').should('exist');
          cy.contains('Next charge on June 1, 2042');
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
          cy.getByDataCy('order-success', { timeout: 20000 }).contains('$500.00 USD / mo.');
          cy.contains(`${user.firstName} ${user.lastName} is now a member of APEX's "Sponsors" tier!`);
        });
      });

      it('Can order with an existing orgnanization', () => {
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
            cy.clock(Date.parse('2042/05/03'));
            cy.tick(1000);
            cy.get(`input[type=radio][name=contributeAs][value=${collective.id}]`).should('be.checked');
            cy.contains('Next step').click();

            cy.checkStepsProgress({ enabled: ['contributeAs', 'details'], disabled: 'payment' });
            cy.get('#interval input').should('exist');
            cy.contains('Next charge on June 1, 2042');
            cy.get('#amount > :nth-child(1)').click();
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
              cy.getByDataCy('order-success', { timeout: 20000 }).contains('$100.00 USD / mo.');
              // TestOrg is the name of the created organization.
              cy.contains('TestOrg is now a member of APEX\'s "Sponsors" tier!');
            });
          });
        });
      });
    });
  }
});
