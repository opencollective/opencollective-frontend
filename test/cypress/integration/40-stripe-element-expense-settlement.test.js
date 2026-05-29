describe('Stripe Settlement Expense', () => {
  before(() => {
    cy.getAccount('ofitech', 'testuser+ofitech@opencollective.com')
      .as('ofitechAccount')
      .then(ofitechAccount => ofitechAccount.payoutMethods.find(pm => pm.type === 'STRIPE'))
      .as('ofitechStripePayoutMethod');
  });

  beforeEach(() => {
    cy.intercept('GET', 'https://js.stripe.com/v3/', req => {
      req.continue(res => {
        res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
      });
    });
  });

  beforeEach(() => {
    cy.signup()
      .as('hostAdmin')
      .then(user => {
        cy.createHostOrganization(user.email).as('host');
      });
  });

  it('Pays settlement expense with Stripe', function () {
    cy.createExpense({
      type: 'SETTLEMENT',
      userEmail: 'testuser+ofitech@opencollective.com',
      payee: { legacyId: this.ofitechAccount.legacyId },
      account: { legacyId: this.host.legacyId },
      payoutMethod: {
        id: this.ofitechStripePayoutMethod.id,
      },
      description: 'Settlement test',
    }).as('settlementExpense');

    cy.get('@settlementExpense').then(expense => {
      cy.login({ email: this.hostAdmin.email, redirect: `/${this.host.slug}/expenses/${expense.legacyId}` });
    });

    cy.getByDataCy('expense-status-msg').contains('Pending');

    cy.contains('button', 'Approve').click();
    cy.getByDataCy('expense-status-msg').contains('Approved');

    cy.contains('button', 'Go to Pay').click();
    cy.getByDataCy('pay-expense-modal').within(() => {
      cy.contains('Pay expense');
      cy.get('.__PrivateStripeElement iframe')
        .first()
        .should(iframe => {
          const body = iframe.contents().find('body');
          expect(body.find('#payment-numberInput')).to.exist;
        })
        .then(iframe => iframe.contents().find('body'))
        .within(() => {
          cy.get('#payment-numberInput').type('4242424242424242');
          cy.get('#payment-expiryInput').type('1235');
          cy.get('#payment-cvcInput').type('123');
          cy.get('#payment-countryInput').select('US');
          cy.get('#payment-postalCodeInput').type('90210');
        });

      cy.contains('button', 'Pay').click();
    });

    cy.getByDataCy('expense-status-msg').contains('Paid');
  });
});
