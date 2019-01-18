import mockRecaptcha from '../mocks/recaptcha';

const visitParams = { onBeforeLoad: mockRecaptcha };

describe('Contribution Flow: Donate', () => {
  it('Can donate as new user', () => {
    // Mock clock so we can check next contribution date in a consistent way
    cy.clock(Date.parse('2042/05/25'));

    const userParams = { firstName: 'Donate', lastName: 'Tester' };
    cy.signup({ user: userParams, redirect: '/apex/donate', visitParams }).then(user => {
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
      cy.get('#totalAmount button.selected').should('exist');

      // Change amount
      cy.get('input[type=number][name=totalAmount]').type('{selectall}1337');
      cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
      cy.contains('.step-details', '$1,337.00');

      // Change frequency - monthly
      cy.get('#interval').click();
      cy.get('.select-month').click();
      cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
      cy.contains('.step-details', '$1,337.00 per month');
      cy.contains('Next contribution: Jun 1, 2042');

      // Change frequency - yearly
      cy.get('#interval').click();
      cy.get('.select-year').click();
      cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
      cy.contains('.step-details', '$1,337.00 per year');
      cy.contains('Next contribution: May 1, 2043');

      cy.contains('Next step').click();

      // ---- Step 3: Payment ----
      cy.checkStepsProgress({ enabled: ['contributeAs', 'details', 'payment'] });
      // As this is a new account, not payment method is configured yet so
      // we should have the credit card form selected by default.
      cy.get('input[type=checkbox][name=save]').should('be.checked');
      cy.wait(1000); // Wait for stripe to be loaded

      // Ensure we display errors
      cy.fillStripeInput(null, { creditCardNumber: 123 });
      cy.contains('button', 'Submit').click();
      cy.contains('Your card number is incomplete.');

      // Submit with valid credit card
      cy.fillStripeInput();
      cy.contains('button', 'Submit').click();

      // ---- Final: Success ----
      cy.get('#page-order-success', { timeout: 20000 }).contains('$1,337.00 per year');
      cy.contains(`${user.firstName} ${user.lastName} is now a backer of APEX.`);

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
      cy.contains('button', 'Submit').click();
      cy.get('#page-order-success', { timeout: 20000 }).contains('Woot woot!');
    });
  });

  it('Can donate as new organization', () => {
    cy.signup({ redirect: '/apex/donate', visitParams }).then(() => {
      cy.contains('#contributeAs > label', 'A new organization').click();

      // Submit is disabled by default
      cy.contains('button', 'Next step').should('be.disabled');

      // Name must be shown on step
      cy.get('#contributeAs input[name=name]').type('Evil Corp');
      cy.get('.step-contributeAs').contains('Evil Corp');

      // Fill form
      cy.get('#contributeAs input[name=website]').type('https://www.youtube.com/watch?v=oHg5SJYRHA0');
      cy.get('#contributeAs input[name=githubHandle]').type('test');
      cy.get('#contributeAs input[name=twitterHandle]').type('test');

      // Submit form
      cy.contains('Next step').click();
      cy.contains('Next step').click();
      cy.wait(2000);
      cy.fillStripeInput();
      cy.contains('button', 'Submit').click();

      // ---- Final: Success ----
      cy.get('#page-order-success', { timeout: 20000 }).contains('$20.00');
      cy.contains('Evil Corp is now a backer of APEX.');
    });
  });
});
