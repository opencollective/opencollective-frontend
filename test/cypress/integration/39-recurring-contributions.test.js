const isNewContributionFlow = Cypress.env('NEW_CONTRIBUTION_FLOW');

describe('Recurring contributions', () => {
  let user;

  before(() => {
    cy.signup({ redirect: '/apex/contribute/sponsors-470/checkout' }).then(u => {
      user = u;
      if (!isNewContributionFlow) {
        cy.get(`[type="radio"][name=contributeAs]`).first().check();
      }

      cy.contains('button', 'Next step').click();

      if (!isNewContributionFlow) {
        cy.contains('Contribution Details');
      } else {
        cy.contains('Contribute as');
      }

      cy.contains('button', 'Next step').click();
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
      cy.wait(2000);
      cy.fillStripeInput();
      cy.getByDataCy('recurring-contribution-submit-pm-button').click();
      cy.contains('[data-cy="recurring-contribution-pm-box"]', 'VISA **** 4242').within(() => {
        cy.getByDataCy('radio-select').check();
      });
      cy.getByDataCy('recurring-contribution-update-pm-button').click();
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
      cy.getByDataCy('recurring-contribution-update-order-button').click();
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
