import mockRecaptcha from '../mocks/recaptcha';

describe('Recurring contributions', () => {
  before(() => {
    const visitParams = { onBeforeLoad: mockRecaptcha };
    cy.login().then(() => {
      cy.visit('/apex/contribute/sponsors-470/checkout', visitParams);
      cy.get(`[type="radio"][name=contributeAs]`).first().check();
      cy.wait(1000);
      cy.contains('Next step').click();
      cy.contains('Next step').click();
      cy.get('#PaymentMethod').then($paymentMethod => {
        if ($paymentMethod.text().includes('VISA **** 4242')) {
          cy.contains('button', 'Make contribution').click();
        } else {
          cy.get('input[type=checkbox][name=save]').should('be.checked');
          cy.wait(1000);
          cy.fillStripeInput();
          cy.contains('button', 'Make contribution').click();
        }
        cy.wait(5000);
      });
    });
  });

  it.skip('Has contributions in the right categories', () => {
    cy.login().then(() => {
      cy.visit(`/testuseradmin/recurring-contributions`);
      cy.getByDataCy('recurring-contribution-filter-tag-monthly').click();
      cy.getByDataCy('recurring-contribution-card').should('have.length', 1);
      cy.getByDataCy('recurring-contribution-filter-tag-yearly').click();
      cy.getByDataCy('recurring-contribution-card').should('have.length', 0);
    });
  });

  it.skip('Can cancel an active contribution', () => {
    cy.login().then(() => {
      cy.visit(`/testuseradmin/recurring-contributions`);
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().contains('Edit');
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu').should('exist');
      cy.getByDataCy('recurring-contribution-menu-cancel-option').click();
      cy.getByDataCy('recurring-contribution-cancel-menu').should('exist');
      cy.getByDataCy('recurring-contribution-cancel-menu').contains('Are you sure?');
      cy.getByDataCy('recurring-contribution-cancel-no').contains('No, wait');
      cy.getByDataCy('recurring-contribution-cancel-yes').click();
      cy.wait(2000);
      cy.getByDataCy('temporary-notification').contains('Your recurring contribution has been cancelled');
      cy.getByDataCy('recurring-contribution-filter-tag-cancelled').click();
      cy.getByDataCy('recurring-contribution-card').should('have.length', 1);
    });
  });
  
  it.skip('Can reactivate a cancelled contribution', () => {
    cy.login().then(() => {
      cy.visit(`/testuseradmin/recurring-contributions`);
      cy.getByDataCy('recurring-contribution-filter-tag-cancelled').click();
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().contains('Activate');
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-activate-yes').click();
      cy.wait(2000);
      cy.getByDataCy('temporary-notification').contains('Recurring contribution activated!');
      cy.getByDataCy('recurring-contribution-filter-tag-active').click();
      cy.getByDataCy('recurring-contribution-card').should('have.length', 1);
    });
  });

  it.skip('Can add a new payment method and use it for the recurring contribution', () => {
    cy.login().then(() => {
      cy.visit(`/testuseradmin/recurring-contributions`);
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu-payment-option').click();
      cy.getByDataCy('recurring-contribution-payment-menu').should('exist');
      cy.getByDataCy('recurring-contribution-add-pm-button').click();
      cy.getByDataCy('new-credit-card-form').should('exist');
      cy.fillStripeInput({
        card: { creditCardNumber: 5555555555554444, expirationDate: '07/23', cvcCode: 713, postalCode: 12345 },
      });
      cy.getByDataCy('recurring-contribution-submit-pm-button').click();
      cy.wait(2000);
      // eslint-disable-next-line no-unused-vars
      cy.contains('[data-cy="recurring-contribution-pm-box"]', 'MASTERCARD **** 4444').within($listBox => {
        cy.getByDataCy('radio-select').check();
      });
      cy.getByDataCy('recurring-contribution-update-pm-button').click();
      cy.wait(2000);
      cy.getByDataCy('temporary-notification').contains('Your recurring contribution has been updated.');
    });
  });
});
