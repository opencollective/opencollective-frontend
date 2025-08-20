import * as cheerio from 'cheerio';

describe('Grant Submission Flow', () => {
  beforeEach(() => {
    cy.signup()
      .as('hostAdmin')
      .then(user => {
        cy.createHostOrganization(user.email)
          .as('host')
          .then(host => {
            cy.signup()
              .as('collectiveAdmin')
              .then(user => {
                cy.createCollectiveV2({
                  email: user.email,
                  skipApproval: true,
                  host: { slug: host.slug },
                  collective: { name: 'Test Collective With Grants', settings: { expenseTypes: { GRANT: true } } },
                }).as('collective');
              });
          });
      });
  });

  it('should allow users to submit a grant application', function () {
    // Go to the grant submission page with the new flow enabled
    cy.visit(`/${this.collective.slug}/grants/new?newGrantFlowEnabled=true`);

    // Verify the page header shows the correct collective name
    cy.contains(`Grant request to ${this.collective.name}`).should('be.visible');

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
    cy.contains('[data-cy="select-option"]', 'Bank transfer');
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
    cy.contains('Review grant request').should('be.visible');

    // Check that the summary shows the correct information
    cy.contains('Grant application for community project').should('be.visible');
    cy.contains('$1,000.00').should('be.visible');
    cy.contains('My Bank Account').should('be.visible');
    cy.contains('AUD').should('be.visible');
    cy.contains('Please send the funds to my bank account: xxxxxxxxxxx').should('be.visible');

    // Submit the grant application
    cy.contains('button', 'Submit Grant Request').click();

    // Verify success message is shown
    cy.contains('Grant request #', { timeout: 20000 }).should('be.visible');
    cy.contains('has been submitted successfully!').should('be.visible');

    // Verify we can see the "View All Grants" button
    cy.contains('View All Grants').should('be.visible');
  });

  it('should allow host admin to create beneficiary', function () {
    cy.login({ email: this.hostAdmin.email, redirect: `/${this.collective.slug}/grants/new?newGrantFlowEnabled=true` });
    cy.contains('button', 'Proceed').click();
    cy.get('#WHO_WILL_RECEIVE_FUNDS').within(() => {
      cy.contains('A beneficiary').click();
      cy.contains('A beneficiary').parent().get('[role="combobox"]').click();
      cy.root().closest('html').contains('Create Beneficiary').click();

      cy.contains('label', "Beneficiary's name").click();
      cy.focused().type('A beneficiary name');

      cy.contains('button', 'Create beneficiary').click();
    });

    cy.get('#PAYOUT_METHOD').within(() => {
      cy.root().scrollIntoView();

      cy.contains('New payout method').click();
      cy.contains('Choose a payout method').click();
      cy.root().closest('html').contains('[role="option"]', 'Other').click();
      cy.contains('Currency').click();
      cy.focused().should('have.attr', 'placeholder', 'Search...').type('USD{enter}');
      cy.contains('label', 'Info').should('be.visible').click();
      cy.focused().type('Please send the funds to my bank account: xxxxxxxxxxx');
      cy.contains('button', 'Save').click();
      cy.root().closest('html').contains('Payout method created').should('exist');
    });

    cy.contains('Application Content').scrollIntoView();
    cy.get('textarea[name="expenseItems.0.description"]').type('Grant application for community project');
    cy.get('input[name="expenseItems.0.amount.valueInCents"]').type('{selectall}1000');

    cy.contains('button', 'Proceed to Summary').click();

    cy.contains('Review grant request').should('be.visible');

    // Check that the summary shows the correct information
    cy.contains('Grant application for community project').should('be.visible');
    cy.contains('$1,000.00').should('be.visible');
    cy.contains('Other').should('be.visible');
    cy.contains('USD').should('be.visible');
    cy.contains('Please send the funds to my bank account: xxxxxxxxxxx').should('be.visible');

    // Submit the grant application
    cy.contains('button', 'Submit Grant Request').click();

    // Verify success message is shown
    cy.contains('Grant request #', { timeout: 20000 }).should('be.visible');
    cy.contains('has been submitted successfully!').should('be.visible');

    // Verify we can see the "View All Grants" button
    cy.contains('View All Grants').should('be.visible');
  });

  it('should allow host admin submit grant existing beneficiary while adding payout method', function () {
    cy.createVendor(
      this.host.slug,
      {
        name: 'existing beneficiary',
      },
      this.hostAdmin.email,
    );

    cy.login({ email: this.hostAdmin.email, redirect: `/${this.collective.slug}/grants/new?newGrantFlowEnabled=true` });
    cy.contains('button', 'Proceed').click();
    cy.get('#WHO_WILL_RECEIVE_FUNDS').within(() => {
      cy.contains('A beneficiary').click();
      cy.contains('A beneficiary').parent().get('[role="combobox"]').click();
      cy.root().closest('html').contains('existing beneficiary').click();
    });

    cy.get('#PAYOUT_METHOD').within(() => {
      cy.root().scrollIntoView();

      cy.contains('New payout method').click();
      cy.contains('Choose a payout method').click();
      cy.root().closest('html').contains('[role="option"]', 'Other').click();
      cy.contains('Currency').click();
      cy.focused().should('have.attr', 'placeholder', 'Search...').type('USD{enter}');
      cy.contains('label', 'Info').should('be.visible').click();
      cy.focused().type('Please send the funds to my bank account: xxxxxxxxxxx');
      cy.contains('button', 'Save').click();
      cy.root().closest('html').contains('Payout method created').should('exist');
    });

    cy.contains('Application Content').scrollIntoView();
    cy.get('textarea[name="expenseItems.0.description"]').type('Grant application for community project');
    cy.get('input[name="expenseItems.0.amount.valueInCents"]').type('{selectall}1000');

    cy.contains('button', 'Proceed to Summary').click();

    cy.contains('Review grant request').should('be.visible');

    // Check that the summary shows the correct information
    cy.contains('Grant application for community project').should('be.visible');
    cy.contains('$1,000.00').should('be.visible');
    cy.contains('Other').should('be.visible');
    cy.contains('USD').should('be.visible');
    cy.contains('Please send the funds to my bank account: xxxxxxxxxxx').should('be.visible');

    // Submit the grant application
    cy.contains('button', 'Submit Grant Request').click();

    // Verify success message is shown
    cy.contains('Grant request #', { timeout: 20000 }).should('be.visible');
    cy.contains('has been submitted successfully!').should('be.visible');

    // Verify we can see the "View All Grants" button
    cy.contains('View All Grants').should('be.visible');
  });

  it('should allow host admin submit grant to existing beneficiary', function () {
    cy.createVendor(
      this.host.slug,
      {
        name: 'existing beneficiary',
        payoutMethod: {
          type: 'OTHER',
          name: '12345',
          data: {
            content: 'Please send the funds to my bank account: xxxxxxxxxxx',
            currency: 'USD',
          },
        },
      },
      this.hostAdmin.email,
    );

    cy.login({ email: this.hostAdmin.email, redirect: `/${this.collective.slug}/grants/new?newGrantFlowEnabled=true` });
    cy.contains('button', 'Proceed').click();
    cy.get('#WHO_WILL_RECEIVE_FUNDS').within(() => {
      cy.contains('A beneficiary').click();
      cy.contains('A beneficiary').parent().get('[role="combobox"]').click();
      cy.root().closest('html').contains('existing beneficiary').click();
    });

    cy.contains('Application Content').scrollIntoView();
    cy.get('textarea[name="expenseItems.0.description"]').type('Grant application for community project');
    cy.get('input[name="expenseItems.0.amount.valueInCents"]').type('{selectall}1000');

    cy.contains('button', 'Proceed to Summary').click();

    cy.contains('Review grant request').should('be.visible');

    // Check that the summary shows the correct information
    cy.contains('Grant application for community project').should('be.visible');
    cy.contains('$1,000.00').should('be.visible');
    cy.contains('Other').should('be.visible');
    cy.contains('USD').should('be.visible');
    cy.contains('Please send the funds to my bank account: xxxxxxxxxxx').should('be.visible');

    // Submit the grant application
    cy.contains('button', 'Submit Grant Request').click();

    // Verify success message is shown
    cy.contains('Grant request #', { timeout: 20000 }).should('be.visible');
    cy.contains('has been submitted successfully!').should('be.visible');

    // Verify we can see the "View All Grants" button
    cy.contains('View All Grants').should('be.visible');
  });

  it('should submit invite grant request across hosts', () => {
    cy.signup()
      .as('hostAdmin')
      .then(user => {
        cy.createHostOrganization(user.email)
          .as('host1')
          .then(host => {
            cy.signup()
              .as('collectiveAdmin1')
              .then(user => {
                cy.createCollectiveV2({
                  email: user.email,
                  skipApproval: true,
                  host: { slug: host.slug },
                  collective: { name: 'Test Collective Under host 1', settings: { expenseTypes: { GRANT: true } } },
                }).as('collective1');
              });
          });
      });

    cy.get<{ email: string }>('@hostAdmin').then(user => {
      cy.createHostOrganization(user.email)
        .as('host2')
        .then(host => {
          cy.createPayoutMethod(
            host.slug,
            {
              type: 'BANK_ACCOUNT',
              data: {
                accountHolderName: 'Account holder name',
                details: {},
                type: 'ABA',
                currency: 'USD',
              },
              name: 'host 2 payout method',
              isSaved: true,
            },
            user.email,
          );

          cy.signup()
            .as('collectiveAdmin2')
            .then(user => {
              cy.createCollectiveV2({
                email: user.email,
                skipApproval: true,
                host: { slug: host.slug },
                collective: { name: 'Test Collective Under host 2', settings: { expenseTypes: { GRANT: true } } },
              }).as('collective2');
            });
        });
    });

    cy.get<{ email: string; collective: { slug: string } }>('@hostAdmin').then(user => {
      cy.get<{ slug: string }>('@collective1').then(col => {
        cy.login({
          email: user.email,
          redirect: `/${col.slug}/grants/new?newGrantFlowEnabled=true`,
        });
      });
    });

    cy.contains('button', 'Proceed').click();
    cy.get<{ slug: string }>('@collective2').then(col => {
      cy.get('#WHO_WILL_RECEIVE_FUNDS').within(() => {
        cy.contains('Invite someone').click();
        cy.contains('Invite someone').parent().get('[role="combobox"]').click();
        cy.contains('Invite someone').parent().get('[role="combobox"]').type(col.slug);
        cy.root().closest('html').contains('[role="option"]', col.slug).click();
      });
    });

    cy.contains('Application Content').scrollIntoView();
    cy.get('textarea[name="expenseItems.0.description"]').type('Grant application for community project');
    cy.get('input[name="expenseItems.0.amount.valueInCents"]').type('{selectall}1000');

    cy.contains('button', 'Proceed to Summary').click();
    cy.contains('button', 'Submit Grant Request').click();

    cy.get<{ email: string }>('@collectiveAdmin2').then(collectiveAdmin => {
      getExpenseInviteEmailLink(collectiveAdmin.email).then(inviteLink => {
        cy.login({
          email: collectiveAdmin.email,
          redirect: encodeURIComponent(inviteLink),
        });
      });
    });

    cy.contains('Continue submission').click();
    cy.contains('button', 'Proceed').click();
    cy.contains('Select a payout method').should('not.exist');
    cy.contains('button', 'Proceed to Summary').click();
    cy.contains('button', 'Submit Grant Request').click();
    cy.contains('has been submitted successfully!').should('be.visible');
  });
});

function getExpenseInviteEmailLink(to: string) {
  return cy
    .openEmail(
      email =>
        email.Tags.some(tag => tag === to.replace('@', '-at-')) &&
        (email.Subject.includes('wants to pay you') || email.Subject.includes('to send funds to')),
    )
    .then(email => {
      const $html = cheerio.load(email.HTML);
      const expenseLink = $html(`a:contains("OK, let's go!")`);
      const href = expenseLink.attr('href');
      const parsedUrl = new URL(href);
      // parsedUrl.searchParams.set('newExpenseFlowEnabled', 'true');
      return `${parsedUrl.pathname}${parsedUrl.search.toString()}`;
    });
}
