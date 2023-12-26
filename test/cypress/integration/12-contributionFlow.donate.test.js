import { CreditCards } from '../../stripe-helpers';
import mockRecaptcha from '../mocks/recaptcha';

const donateRoute = '/apex/donate';
const visitParams = { onBeforeLoad: mockRecaptcha };

const retriesConfig3DSecure = { retries: { runMode: 2, openMode: 0 } };

describe('Contribution Flow: Donate', () => {
  it('Can donate as new user', () => {
    const userParams = { name: 'Donate Tester' };
    cy.signup({ user: userParams, redirect: donateRoute, visitParams });

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
    cy.contains('[data-cy="progress-step-details"]', '$1,337.00 USD / mo.');
    cy.contains("Today's charge");
    // next charge in 2 months time, first day, because it was made on or after 15th.
    cy.contains('the next charge will be on July 1, 2042');

    // Change frequency - yearly
    cy.contains('#interval button', 'Yearly').click();
    cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
    cy.contains('[data-cy="progress-step-details"]', '$1,337.00 USD / yr.');
    cy.contains("Today's charge");
    cy.contains('the next charge will be on May 1, 2043');

    cy.get('button[data-cy="cf-next-step"]').click();

    // ---- Step profile ----
    cy.checkStepsProgress({ enabled: ['profile', 'details'], disabled: 'payment' });

    // Personal account must be the first entry, and it must be checked
    const userName = userParams.name;
    cy.contains('[data-cy="contribute-profile-picker"]', userName);
    cy.contains('[data-cy="contribute-profile-picker"]', 'Personal');
    cy.getByDataCy('contribute-profile-picker').click();
    cy.contains('[data-cy="select-option"]:first', userName);
    cy.contains('[data-cy="select-option"]:first', 'Personal');
    cy.get('body').type('{esc}');

    // User profile is shown on step, all other steps must be disabled
    cy.getByDataCy(`progress-step-profile`).contains(userName);
    cy.get('button[data-cy="cf-next-step"]').click();

    // ---- Step Payment ----
    cy.checkStepsProgress({ enabled: ['profile', 'details', 'payment'] });
    // As this is a new account, not payment method is configured yet so
    // we should have the credit card form selected by default.
    cy.get('input[type=checkbox][name=save]').should('be.checked');
    cy.wait(1000); // Wait for stripe to be loaded

    // Ensure we display errors
    cy.fillStripeInput({ card: { creditCardNumber: 123 } });
    cy.contains('button', 'Contribute $1,337').click();
    cy.contains('Credit card ZIP code and CVC are required');

    // Submit with valid credit card
    cy.fillStripeInput();
    cy.contains('button', 'Contribute $1,337').click();

    // ---- Final: Success ----
    cy.getByDataCy('order-success', { timeout: 20000 }).contains('$1,337.00 USD / year');
    cy.contains(`You are now supporting APEX.`);

    // ---- Let's go back ---
    cy.go('back');

    // We're back on the payment step
    // Previous credit card should be added to the account
    cy.contains('#PaymentMethod label:first', 'VISA ****');
    cy.get('#PaymentMethod label:first input[type=radio]').should('be.checked');

    // Submit a new order with existing card
    cy.contains('button', 'Contribute $1,337').click();
    cy.getByDataCy('order-success', { timeout: 20000 }).contains('Thank you!');
  });

  it('Can donate as new organization', () => {
    cy.signup({ redirect: donateRoute, visitParams });

    cy.get('#amount > :nth-child(3)').click();
    cy.get('button[data-cy="cf-next-step"]:not([disabled])').click();
    cy.getByDataCy('contribute-profile-picker').click();
    cy.contains('[data-cy="select-option"]', 'Create Organization').click();

    // Fill form
    cy.getByDataCy('create-collective-mini-form').as('createOrgForm');
    cy.get('@createOrgForm').find('input[name=name]').type('Evil Corp');
    cy.get('@createOrgForm').find('input[name=website]').type('https://www.youtube.com/watch?v=oHg5SJYRHA0');
    cy.get('@createOrgForm').find('button[type=submit]').click();
    cy.contains('[data-cy="contribute-profile-picker"]', 'Evil Corp');

    // Name must be shown on step
    cy.getByDataCy('progress-step-profile').contains('Evil Corp');

    // Submit form
    cy.get('button[data-cy="cf-next-step"]:not([disabled])').click();
    cy.wait(2000);
    cy.fillStripeInput();
    cy.contains('button', 'Contribute $20').click();

    // ---- Final: Success ----
    cy.getByDataCy('order-success', { timeout: 20000 }).contains('$20.00 USD');
    cy.contains('You are now supporting APEX.');
  });

  it('Forces params if given in URL', () => {
    cy.signup({ redirect: `${donateRoute}/42/year`, visitParams });

    cy.clock(Date.parse('2042/05/25'));
    cy.contains('the next charge will be on May 1, 2043');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.checkStepsProgress({ enabled: ['details', 'profile'] });
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.wait(2000); // Wait for stripe to be loaded
    cy.fillStripeInput();

    // Should display the contribution details
    cy.contains('[data-cy="progress-step-details"]', '$42.00 USD / yr.');

    // Submit order
    cy.contains('button', 'Contribute $42').click();

    // Check success page
    cy.getByDataCy('order-success', { timeout: 20000 }).contains('$42.00 USD / year');
    cy.contains('You are now supporting APEX.');
  });

  it('works with 3D secure', retriesConfig3DSecure, () => {
    cy.signup({ redirect: `${donateRoute}/42/year`, visitParams, user: { name: 'John Doe' } });
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.checkStepsProgress({ enabled: ['details', 'profile', 'payment'] });
    cy.wait(3000); // Wait for stripe to be loaded
    cy.fillStripeInput({ card: CreditCards.CARD_3D_SECURE_2 });
    cy.contains('button', 'Contribute $42').click();
    cy.wait(8000); // Wait for order to be submitted and popup to appear

    // Rejecting the validation should produce an error
    cy.complete3dSecure(false, { version: 2 });
    cy.contains('We are unable to authenticate your payment method.');

    // Refill stripe input to avoid using the same token twice
    cy.fillStripeInput({ card: CreditCards.CARD_3D_SECURE_2 });

    // Re-trigger the popup
    cy.contains('button', 'Contribute $42').click();

    // Approving the validation should create the order
    cy.wait(8000); // Wait for order to be submitted and popup to appear
    cy.complete3dSecure(true, { version: 2 });
    cy.getByDataCy('order-success', { timeout: 20000 });
    cy.contains('You are now supporting APEX.');
  });

  /**
   * This test is a bit special, we're hacking the regular flow to simulate a case where
   * the SCA / 2DSecure confirmation is required while processing recurring contributions.
   * In such cases, the `templates/emails/payment.creditcard.confirmation.hbs` email is sent
   * with a link to `/orders/:orderId/confirm`.
   */
  it('confirms the order through the separate page', retriesConfig3DSecure, () => {
    cy.signup({ redirect: `${donateRoute}`, visitParams, user: { name: 'John Doe' } });
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.checkStepsProgress({ enabled: ['details', 'profile', 'payment'] });
    cy.wait(3000); // Wait for stripe to be loaded
    cy.fillStripeInput({ card: CreditCards.CARD_3D_SECURE_ALWAYS_AUTHENTICATE });

    // Submit the order, intercept the response to get the order ID
    cy.intercept({ method: 'POST', path: '/api/graphql/v2' }, req => {
      if (req.body?.operationName === 'CreateOrder') {
        req.alias = 'createOrder';
      }
    });

    cy.contains('button', 'Contribute $20').click();

    cy.wait('@createOrder').then(({ response }) => {
      const orderId = response.body.data.createOrder.order.legacyId;

      // At this point, the order has been created but not confirmed yet. We're leaving this page without doing
      // so to instead go to the confirmation page directly.
      cy.visit(`/orders/${orderId}/confirm`);
      cy.wait(2000);

      // Rejecting the validation should produce an error
      cy.complete3dSecure(true);
      cy.contains('Your payment method has now been confirmed and the payment successfully went through');
    });
  });

  it('Shows Stripe errors in the frontend', () => {
    cy.signup({ redirect: donateRoute, visitParams, user: { name: 'John Doe' } });
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.wait(3000); // Wait for stripe to be loaded
    cy.fillStripeInput({ card: CreditCards.CARD_DECLINED });
    cy.getByDataCy('cf-next-step').click();
    cy.contains('[data-cy="contribution-flow-error"]', 'Your card was declined.');
  });
});
