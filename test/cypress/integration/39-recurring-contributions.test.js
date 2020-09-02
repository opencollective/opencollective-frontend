describe.skip('Recurring contributions', () => {
  let user;

  before(() => {
    cy.signup({ redirect: '/apex/contribute/sponsors-470/checkout' }).then(u => {
      user = u;
      cy.get(`[type="radio"][name=contributeAs]`).first().check();
      cy.contains('Next step').click();
      cy.contains('Contribution Details');
      cy.contains('Next step').click();
      cy.useAnyPaymentMethod();
      cy.contains('button', 'Make contribution').click();
      cy.getByDataCy('order-success');
    });
  });

  it('Has contributions in the right categories', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('filter-button monthly').click();
      cy.getByDataCy('recurring-contribution-card').should('have.length', 1);
      cy.getByDataCy('filter-button yearly').click();
      cy.getByDataCy('recurring-contribution-card').should('have.length', 0);
    });
  });

  it('Can add a new payment method and use it for the recurring contribution', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu-payment-option').click();
      cy.getByDataCy('recurring-contribution-payment-menu').should('exist');
      cy.getByDataCy('recurring-contribution-add-pm-button').click();
      cy.wait(5000);
      cy.fillStripeInput({
        card: { creditCardNumber: 5555555555554444, expirationDate: '07/23', cvcCode: 713, postalCode: 12345 },
      });
      cy.server();
      // no third argument, we don't want to stub the response, we just want to wait on it
      cy.route('POST', '/api/graphql/v2').as('cardadded');
      cy.getByDataCy('recurring-contribution-submit-pm-button').click();
      cy.wait('@cardadded', { responseTimeout: 15000 }).its('status').should('eq', 200);
      cy.contains('[data-cy="recurring-contribution-pm-box"]', 'MASTERCARD **** 4444').within(() => {
        cy.getByDataCy('radio-select').check();
      });
      cy.route('POST', '/api/graphql/v2').as('updatepm');
      cy.getByDataCy('recurring-contribution-update-pm-button').click();
      cy.wait('@updatepm', { responseTimeout: 15000 }).its('status').should('eq', 200);
      cy.getByDataCy('temporary-notification').contains('Your recurring contribution has been updated.');
    });
  });

  it('Can change the tier and amount of the order', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu-tier-option').click();
      cy.getByDataCy('recurring-contribution-order-menu').should('exist');
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Backers').within(() => {
        cy.getByDataCy('radio-select').check();
      });
      cy.server();
      cy.route('POST', '/api/graphql/v2').as('updateorder');
      cy.getByDataCy('recurring-contribution-update-order-button').click();
      cy.wait('@updateorder', { responseTimeout: 15000 }).its('status').should('eq', 200);
      cy.getByDataCy('temporary-notification').contains('Your recurring contribution has been updated.');
      cy.getByDataCy('recurring-contribution-amount-contributed').contains('$2.00 USD / month');
    });
  });

  it('Can cancel an active contribution', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().contains('Edit');
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu').should('exist');
      cy.getByDataCy('recurring-contribution-menu-cancel-option').click();
      cy.getByDataCy('recurring-contribution-cancel-menu').should('exist');
      cy.getByDataCy('recurring-contribution-cancel-menu').contains('Are you sure?');
      cy.getByDataCy('recurring-contribution-cancel-no').contains('No, wait');
      cy.getByDataCy('recurring-contribution-cancel-yes')
        .click()
        .then(() => {
          cy.getByDataCy('temporary-notification').contains('Your recurring contribution has been cancelled');
          cy.getByDataCy('filter-button cancelled').click();
          cy.getByDataCy('recurring-contribution-card').should('have.length', 1);
        });
    });
  });
});
