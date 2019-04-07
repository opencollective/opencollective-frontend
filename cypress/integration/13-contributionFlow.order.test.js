import mockRecaptcha from '../mocks/recaptcha';

/**
 * Test the order flow. We don't test for validations here as it is already done
 * in `12-contributionFlow.donate.test`.
 */
describe('Contribution Flow: Order', () => {
  it('Can order as new user', () => {
    // Mock clock so we can check next contribution date in a consistent way
    cy.clock(Date.parse('2042/05/25'));

    const userParams = { firstName: 'Order', lastName: 'Tester' };
    const visitParams = { onBeforeLoad: mockRecaptcha };
    cy.signup({ user: userParams, redirect: '/apex/contribute/tier/470-sponsors', visitParams }).then(user => {
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

      // Frequency must be disabled
      cy.get('#interval[disabled]').should('exist');
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
      cy.get('#page-order-success', { timeout: 20000 }).contains('$500.00 per month');
      cy.contains(`${user.firstName} ${user.lastName} is now a member of APEX's 'Sponsors' tier!`);
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

        cy.visit('/apex/contribute/tier/470-sponsors', visitParams);
        // Check the newly created organization
        cy.get(`[type="radio"][name=contributeAs][value=${collective.id}]`).check();
        cy.tick(1000);
        cy.get(`input[type=radio][name=contributeAs][value=${collective.id}]`).should('be.checked');

        cy.contains('Next step').click();

        cy.checkStepsProgress({ enabled: ['contributeAs', 'details'], disabled: 'payment' });
        cy.get('#interval[disabled]').should('exist');
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
          cy.get('#page-order-success', { timeout: 20000 }).contains('$100.00 per month');
          // TestOrg is the name of the created organization.
          cy.contains("TestOrg is now a member of APEX's 'Sponsors' tier!");
        });
      });
    });
  });
});
