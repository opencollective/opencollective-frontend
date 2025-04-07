describe('Grant Submission Flow', () => {
  let user;
  let collective;
  let host;

  before(() => {
    cy.signup().then(u => {
      user = u;
      // Create a host organization that will be used as the fiscal host
      cy.createHostOrganization(user.email).then(h => {
        host = h;
        // Create a collective with GRANT expense type enabled
        cy.createCollectiveV2({
          email: user.email,
          collective: { name: 'Test Collective With Grants', settings: { expenseTypes: { GRANT: true } } },
          host,
        }).then(c => {
          collective = c;
        });
      });
    });
  });

  it('should allow users to submit a grant application', () => {
    // Go to the grant submission page with the new flow enabled
    cy.visit(`/${collective.slug}/grants/new?newGrantFlowEnabled=true`);

    // Verify the page header shows the correct collective name
    cy.contains(`Grant Application to ${collective.name}`).should('be.visible');

    // ---- Step 1: Information ----
    // Grant Provider section should be visible
    cy.contains('Grant Provider').should('be.visible');

    // If there are instructions, they must be acknowledged

    // Click on the Proceed button to move to the next section
    cy.contains('button', 'Proceed').click();

    // ---- Step 2: Application Form ----
    // Who will receive the funds section
    cy.contains('Who will receive the funds?').should('be.visible');

    // Select self as the payee (myself option)
    cy.get('[data-cy="payee-selector"]').should('exist');
    cy.get('[data-cy="payee-myself-option"]').click();

    // Select a payout method section
    cy.contains('Select a payout method').should('be.visible');

    // Add a new payout method
    cy.get('[data-cy="add-new-payout-method"]').click();
    cy.get('[data-cy="payout-method-type-select"]').click();
    cy.contains('[data-cy="select-option"]', 'Bank account');
    cy.contains('[data-cy="select-option"]', 'Other').click();
    cy.get('[data-cy="currency-picker"]').click();
    cy.contains('[data-cy="select-option"]', 'AUD').click();
    cy.get('input[name="newPayoutMethod.name"]').type('My Bank Account');

    // Application content section
    cy.contains('Application Content').scrollIntoView().should('be.visible');
    cy.get('textarea[name="expenseItems.0.description"]').type('Grant application for community project');
    cy.get('input[name="expenseItems.0.amount.valueInCents"]').type('{selectall}1000');

    // Proceed to summary
    cy.contains('button', 'Proceed to Summary').click();

    // Validation: We're missing the payout method content
    cy.contains('#PAYOUT_METHOD', 'The value is too short');
    cy.get('textarea[name="newPayoutMethod.data.content"]').type(
      'Please send the funds to my bank account: xxxxxxxxxxx',
    );

    cy.contains('button', 'Proceed to Summary').click();

    // ---- Step 3: Summary ----
    // Verify we're on the summary page
    cy.contains('Review application').should('be.visible');

    // Check that the summary shows the correct information
    cy.contains('Grant application for community project').should('be.visible');
    cy.contains('$1,000.00').should('be.visible');
    cy.contains('My Bank Account').should('be.visible');
    cy.contains('AUD').should('be.visible');
    cy.contains('Please send the funds to my bank account: xxxxxxxxxxx').should('be.visible');

    // Submit the grant application
    cy.contains('button', 'Submit Application').click();

    // Verify success message is shown
    cy.contains('Grant application #', { timeout: 20000 }).should('be.visible');
    cy.contains('has been submitted successfully!').should('be.visible');

    // Verify we can see the "View All Expenses" button
    cy.contains('View All Expenses').should('be.visible');
  });
});
