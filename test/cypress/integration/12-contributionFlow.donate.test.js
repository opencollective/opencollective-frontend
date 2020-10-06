import { CreditCards } from '../../stripe-helpers';
import mockRecaptcha from '../mocks/recaptcha';

const isNewContributionFlow = Cypress.env('NEW_CONTRIBUTION_FLOW');
const legacyFlowRoute = isNewContributionFlow ? '/apex/legacy/donate' : '/apex/donate';
const newFlowRoute = isNewContributionFlow ? '/apex/donate' : '/apex/new-donate';
const visitParams = { onBeforeLoad: mockRecaptcha };

describe('Contribution Flow: Donate', () => {
  describe('New flow', () => {
    it('Can donate as new user', () => {
      const userParams = { firstName: 'Donate', lastName: 'Tester' };
      cy.signup({ user: userParams, redirect: newFlowRoute, visitParams }).then(user => {
        // Mock clock so we can check next contribution date in a consistent way
        cy.clock(Date.parse('2042/05/25'));

        // ---- Step Details ----
        // Has default amount selected
        cy.get('#amount button.selected').should('exist');

        // Change amount
        cy.getByDataCy('amount-picker-btn-other').click();
        cy.get('input[type=number][name=custom-amount]').type('{selectall}1337');
        cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
        cy.contains('[data-cy="progress-step-details"]', '$1,337.00');

        // Change frequency - monthly
        cy.contains('#interval button', 'Monthly').click();
        cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
        cy.contains('[data-cy="progress-step-details"]', '$1,337.00 USD / month');
        cy.contains("Today's charge");
        // next charge in 2 months time, first day, because it was made on or after 15th.
        cy.contains('Next charge on July 1, 2042');

        // Change frequency - yearly
        cy.contains('#interval button', 'Yearly').click();
        cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
        cy.contains('[data-cy="progress-step-details"]', '$1,337.00 USD / year');
        cy.contains("Today's charge");
        cy.contains('Next charge on May 1, 2043');

        cy.contains('Next step').click();

        // ---- Step profile ----
        cy.checkStepsProgress({ enabled: ['profile', 'details'], disabled: 'payment' });
        // Personal account must be the first entry, and it must be checked
        cy.contains('[data-cy="ContributionProfile"] > label:first', `${user.firstName} ${user.lastName}`);
        cy.contains('[data-cy="ContributionProfile"] > label:first', `Personal`);
        cy.contains('[data-cy="ContributionProfile"] > label:first', user.email);
        cy.get('[data-cy="ContributionProfile"] > label:first input[type=radio]').should('be.checked');

        // User profile is shown on step, all other steps must be disabled
        cy.getByDataCy(`progress-step-profile`).contains(`${user.firstName} ${user.lastName}`);
        cy.contains('Next step').click();

        // ---- Step Payment ----
        cy.checkStepsProgress({ enabled: ['profile', 'details', 'payment'] });
        // As this is a new account, not payment method is configured yet so
        // we should have the credit card form selected by default.
        cy.get('input[type=checkbox][name=save]').should('be.checked');
        cy.wait(1000); // Wait for stripe to be loaded

        // Ensure we display errors
        cy.fillStripeInput({ card: { creditCardNumber: 123 } });
        cy.contains('button', 'Make contribution').click();
        cy.contains('Your card number is incomplete.');

        // Submit with valid credit card
        cy.fillStripeInput();
        cy.contains('button', 'Make contribution').click();

        // ---- Final: Success ----
        cy.getByDataCy('order-success', { timeout: 20000 }).contains('$1,337.00 USD / year');
        cy.contains(`You are now supporting APEX.`);

        // ---- Let's go back ---
        cy.go('back');

        // Steps should be reset
        cy.checkStepsProgress({ enabled: 'details', disabled: ['profile', 'payment'] });

        // Previous credit card should be added to the account
        cy.contains('Next step').click();
        cy.contains('Next step').click();
        cy.contains('#PaymentMethod label:first', 'VISA ****');
        cy.get('#PaymentMethod label:first input[type=radio]').should('be.checked');

        // Submit a new order with existing card
        cy.contains('button', 'Make contribution').click();
        cy.getByDataCy('order-success', { timeout: 20000 }).contains('Thank you!');
      });
    });

    it('Can donate as new organization', () => {
      cy.signup({ redirect: newFlowRoute, visitParams }).then(() => {
        cy.get('#amount > :nth-child(3)').click();
        cy.contains('button:not([disabled])', 'Next step').click();
        cy.contains('[data-cy="ContributionProfile"] > label', 'A new organization').click();

        // Name must be shown on step
        cy.get('[data-cy="ContributionProfile"] input[name=name]').type('Evil Corp');
        cy.getByDataCy('progress-step-profile').contains('Evil Corp');

        // Fill form
        cy.get('[data-cy="ContributionProfile"] input[name=website]').type(
          'https://www.youtube.com/watch?v=oHg5SJYRHA0',
        );
        cy.get('[data-cy="ContributionProfile"] input[name=twitterHandle]').type('test');

        // Submit form
        cy.contains('button:not([disabled])', 'Next step').click();
        cy.wait(2000);
        cy.fillStripeInput();
        cy.contains('button', 'Make contribution').click();

        // ---- Final: Success ----
        cy.getByDataCy('order-success', { timeout: 20000 }).contains('$20.00 USD');
        cy.contains('You are now supporting APEX.');
      });
    });

    // Can only be tested if the new flow is the default. Adding support for this test when
    // using the Beta routes would intoduce too much complexity.
    if (isNewContributionFlow) {
      it('Forces params if given in URL', () => {
        cy.signup({ redirect: `${newFlowRoute}/42/year`, visitParams }).then(() => {
          cy.clock(Date.parse('2042/05/25'));
          cy.contains("Today's charge");
          cy.contains('Next charge on May 1, 2043');
          cy.contains('button', 'Next step').click();
          cy.checkStepsProgress({ enabled: ['details', 'profile'] });
          cy.contains('button', 'Next step').click();
          cy.wait(1000); // Wait for stripe to be loaded
          cy.fillStripeInput();
          cy.contains('Next step').click();

          // Should display the contribution details
          cy.contains('[data-cy="progress-step-details"]', '$42.00 USD / year');

          // Submit order
          cy.contains('button', 'Make contribution').click();

          // Check success page
          cy.getByDataCy('order-success', { timeout: 20000 }).contains('$42.00 USD / year');
          cy.contains('You are now supporting APEX.');
        });
      });

      it('works with 3D secure', () => {
        cy.signup({ redirect: `${newFlowRoute}/42/year`, visitParams, user: { name: 'John Doe' } });
        cy.contains('button', 'Next step').click();
        cy.contains('button', 'Next step').click();
        cy.checkStepsProgress({ enabled: ['details', 'profile', 'payment'] });
        cy.wait(3000); // Wait for stripe to be loaded
        cy.fillStripeInput({ card: CreditCards.CARD_3D_SECURE });
        cy.contains('button', 'Make contribution').click();
        cy.wait(8000); // Wait for order to be submitted and popup to appear

        // Rejecting the validation should produce an error
        cy.complete3dSecure(false);
        cy.contains('We are unable to authenticate your payment method.');

        // Refill stripe input to avoid using the same token twice
        cy.fillStripeInput({ card: CreditCards.CARD_3D_SECURE });

        // Re-trigger the popup
        cy.contains('button', 'Make contribution').click();

        // Approving the validation should create the order
        cy.wait(8000); // Wait for order to be submitted and popup to appear
        cy.complete3dSecure(true);
        cy.getByDataCy('order-success', { timeout: 20000 });
        cy.contains('You are now supporting APEX.');
      });
    }
  });

  if (!isNewContributionFlow) {
    describe('Old flow', () => {
      it('Can donate as new user', () => {
        const userParams = { firstName: 'Donate', lastName: 'Tester' };
        cy.signup({ user: userParams, redirect: legacyFlowRoute, visitParams }).then(user => {
          // Mock clock so we can check next contribution date in a consistent way
          cy.clock(Date.parse('2042/05/25'));

          // ---- Step profile ----
          // Personal account must be the first entry, and it must be checked
          cy.contains('[data-cy="ContributionProfile"] > label:first', `${user.firstName} ${user.lastName}`);
          cy.contains('[data-cy="ContributionProfile"] > label:first', `Personal`);
          cy.contains('[data-cy="ContributionProfile"] > label:first', user.email);
          cy.get('[data-cy="ContributionProfile"] > label:first input[type=radio]').should('be.checked');

          // User profile is shown on step, all other steps must be disabled
          cy.getByDataCy(`progress-step-contributeAs`).contains(`${user.firstName} ${user.lastName}`);

          cy.contains('Next step').click();

          // ---- Step Details ----
          cy.checkStepsProgress({ enabled: ['contributeAs', 'details'], disabled: 'payment' });
          // Has default amount selected
          cy.get('#amount button.selected').should('exist');

          // Change amount
          cy.getByDataCy('amount-picker-btn-other').click();
          cy.get('input[type=number][name=custom-amount]').type('{selectall}1337');
          cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
          cy.contains('[data-cy="progress-step-details"]', '$1,337.00');

          // Change frequency - monthly
          cy.get('#interval').click();
          cy.contains('[data-cy="select-option"]', 'Monthly').click();
          cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
          cy.contains('[data-cy="progress-step-details"]', '$1,337.00 per month');
          // next charge in 2 months time, first day, because it was made on or after 15th.
          cy.contains('Next charge on July 1, 2042');

          // Change frequency - yearly
          cy.get('#interval').click();
          cy.contains('[data-cy="select-option"]', 'Yearly').click();
          cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
          cy.contains('[data-cy="progress-step-details"]', '$1,337.00 per year');
          cy.contains('Next charge on May 1, 2043');

          cy.contains('Next step').click();

          // ---- Step Payment ----
          cy.checkStepsProgress({ enabled: ['contributeAs', 'details', 'payment'] });
          // As this is a new account, not payment method is configured yet so
          // we should have the credit card form selected by default.
          cy.get('input[type=checkbox][name=save]').should('be.checked');
          cy.wait(1000); // Wait for stripe to be loaded

          // Ensure we display errors
          cy.fillStripeInput({ card: { creditCardNumber: 123 } });
          cy.contains('button', 'Make contribution').click();
          cy.contains('Your card number is incomplete.');

          // Submit with valid credit card
          cy.fillStripeInput();
          cy.contains('button', 'Make contribution').click();

          // ---- Final: Success ----
          cy.getByDataCy('order-success', { timeout: 20000 }).contains('$1,337.00 USD / yr.');
          cy.contains(`${user.firstName} ${user.lastName} is now a backer of APEX!`);

          // ---- Let's go back ---
          cy.go('back');

          // Steps should be reset
          cy.checkStepsProgress({ enabled: 'contributeAs', disabled: ['details', 'payment'] });

          // Previous credit card should be added to the account
          cy.reload(visitParams).reload(visitParams);
          cy.contains('Next step').click();
          cy.contains('Next step').click();
          cy.contains('#PaymentMethod label:first', 'VISA ****');
          cy.get('#PaymentMethod label:first input[type=radio][name=PaymentMethod]').should('be.checked');

          // Submit a new order with existing card
          cy.contains('button', 'Make contribution').click();
          cy.getByDataCy('order-success', { timeout: 20000 }).contains('Woot woot!');
        });
      });

      it('Can donate as new organization', () => {
        cy.signup({ redirect: legacyFlowRoute, visitParams }).then(() => {
          cy.contains('[data-cy="ContributionProfile"] > label', 'A new organization').click();

          // Name must be shown on step
          cy.get('[data-cy="ContributionProfile"] input[name=name]').type('Evil Corp');
          cy.getByDataCy('progress-step-contributeAs').contains('Evil Corp');

          // Fill form
          cy.get('[data-cy="ContributionProfile"] input[name=website]').type(
            'https://www.youtube.com/watch?v=oHg5SJYRHA0',
          );
          cy.get('[data-cy="ContributionProfile"] input[name=githubHandle]').type('test');
          cy.get('[data-cy="ContributionProfile"] input[name=twitterHandle]').type('test');

          // Submit form
          cy.contains('button:not([disabled])', 'Next step').click();
          cy.get('#amount > :nth-child(3)').click();
          cy.contains('button:not([disabled])', 'Next step').click();
          cy.wait(2000);
          cy.fillStripeInput();
          cy.contains('button', 'Make contribution').click();

          // ---- Final: Success ----
          cy.getByDataCy('order-success', { timeout: 20000 }).contains('$20.00 USD');
          cy.contains('Evil Corp is now a backer of APEX!');
        });
      });

      it('Forces params if given in URL', () => {
        cy.signup({ redirect: `${legacyFlowRoute}/42/year`, visitParams }).then(() => {
          cy.clock(Date.parse('2042/05/25'));
          cy.contains('button', 'Next step').click();

          // Second step should be payment method select
          cy.checkStepsProgress({ enabled: ['contributeAs', 'payment'] });
          cy.wait(1000); // Wait for stripe to be loaded
          cy.fillStripeInput();
          cy.contains('Next step').click();

          // Should display the contribution details
          cy.getByDataCy('contribution-details').then($container => {
            const text = $container[0].innerText;
            expect(text).to.contain('Contribution details:');
            expect(text).to.contain('You’ll contribute with the amount of $42.00 yearly.');
            expect(text).to.contain("Today's charge");
          });

          cy.contains('Next charge on May 1, 2043');

          // Submit order
          cy.contains('button', 'Make contribution').click();

          // Check success page
          cy.getByDataCy('order-success', { timeout: 20000 }).contains('$42.00 USD / yr.');
          cy.contains("You're now a backer of APEX!");
        });
      });

      it('works with 3D secure', () => {
        cy.signup({ redirect: `${legacyFlowRoute}/42/year`, visitParams });
        cy.contains('button', 'Next step').click();
        cy.checkStepsProgress({ enabled: ['contributeAs', 'payment'] });
        cy.wait(1000); // Wait for stripe to be loaded

        cy.fillStripeInput({ card: CreditCards.CARD_3D_SECURE });
        cy.contains('button', 'Make contribution').click();
        cy.wait(10000); // 3D secure popup takes some time to appear

        // Using 3D secure should trigger an iframe
        const iframeSelector = 'iframe[name^="__privateStripeFrame"]';

        // Rejecting the validation should produce an error
        cy.get(iframeSelector).then($3dSecureIframe => {
          const $challengeIframe = $3dSecureIframe.contents().find('body iframe#challengeFrame');
          const $acsIframe = $challengeIframe.contents().find('iframe[name="acsFrame"]');
          const $finalContent = $acsIframe.contents().find('body');
          $finalContent.find('#test-source-fail-3ds').click();
        });
        cy.contains(
          'We are unable to authenticate your payment method. Please choose a different payment method and try again.',
        );

        // Refill stripe input to avoid using the same token twice
        cy.fillStripeInput({ card: CreditCards.CARD_3D_SECURE });

        // Re-trigger the popup
        cy.contains('button', 'Make contribution').click();
        cy.wait(7500); // 3D secure popup takes some time to appear

        // Approving the validation should create the order
        cy.get(iframeSelector).then($3dSecureIframe => {
          const $challengeIframe = $3dSecureIframe.contents().find('body iframe#challengeFrame');
          const $acsIframe = $challengeIframe.contents().find('iframe[name="acsFrame"]');
          const $finalContent = $acsIframe.contents().find('body');
          $finalContent.find('#test-source-authorize-3ds').click();
        });

        cy.contains("You're now a backer of APEX!", { timeout: 15000 });
      });
    });
  }
});
