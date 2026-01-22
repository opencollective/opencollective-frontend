import * as cheerio from 'cheerio';

describe('Recurring contributions', () => {
  let user;
  let collectiveSlug;

  before(() => {
    cy.createHostedCollective({ type: 'COLLECTIVE' })
      .then(collective => {
        collectiveSlug = collective.slug;
        cy.login({ redirect: `/dashboard/${collectiveSlug}/tiers` });
        cy.getByDataCy('create-contribute-tier').click();
        cy.get('input[data-cy="name"]').type('Recurring Fixed Donation Tier');
        cy.get('[data-cy="select-interval"]').click();
        cy.contains('[data-cy="select-option"]', 'Monthly').click();
        cy.get('input[data-cy="amount"]').type('10');
        cy.getByDataCy('confirm-btn').click();
        cy.checkToast({ variant: 'success', message: 'Tier created.' });
        cy.logout();
      })
      .then(() => {
        cy.signup({ redirect: `/${collectiveSlug}/donate` }).then(u => {
          user = u;
          cy.get('#interval > :nth-child(2)').click();
          cy.get('button[data-cy="cf-next-step"]').click();
          cy.contains('Contribute as');
          cy.get('button[data-cy="cf-next-step"]').click();
          cy.useAnyPaymentMethod();
          cy.contains('button', 'Contribute').click();
          cy.getByDataCy('order-success');
        });
      });
  });

  it('Has contributions in the right categories', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` }).then(() => {
      // Filter by Yearly frequency
      cy.getByDataCy('add-filter').click();
      cy.contains('Frequency').click();
      cy.get('[data-cy="combo-select-option"][data-value=YEARLY]').click();
      cy.getByDataCy('apply-filter').click();
      cy.get('[data-cy^="datatable-row"]').should('have.length', 0);
      // Filter by Monthly frequency
      cy.getByDataCy('filter-frequency').click();
      cy.get('[data-cy="combo-select-option"][data-value=MONTHLY]').click();
      cy.getByDataCy('apply-filter').click();
      cy.get('[data-cy^="datatable-row"]').should('have.length', 1);
    });
  });

  it(
    'Can add a new payment method and use it for the recurring contribution',
    {
      retries: {
        runMode: 2,
        openMode: 1,
      },
    },
    () => {
      cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` }).then(
        () => {
          cy.getByDataCy('actions-menu-trigger').first().click();
          cy.contains('Update payment method').click();
          cy.get('input[type=radio][value="stripe-payment-element"]').check();
          cy.getStripePaymentElement({ timeout: 10000 }).should('be.visible');
          cy.fillStripePaymentElementInput();
          cy.getByDataCy('recurring-contribution-submit-pm-button').click();
          cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
        },
      );
    },
  );

  it('Can change the tier and amount of the order', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` }).then(() => {
      cy.getByDataCy('actions-menu-trigger').first().click();
      cy.contains('Update amount').click();
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Backer').within(() => {
        cy.get('input[type="radio"]').check();
      });
      cy.getByDataCy('recurring-contribution-update-order-button').click();
      cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      cy.contains('[data-cy^="datatable-row"]', '$5.00').should('exist');
    });
  });

  it('Can select a fixed recurring contribution tier', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` }).then(() => {
      cy.getByDataCy('actions-menu-trigger').first().click();
      cy.contains('Update amount').click();
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Recurring Fixed Donation Tier').within(() => {
        cy.get('input[type="radio"]').check();
      });
      cy.getByDataCy('recurring-contribution-update-order-button').click();
      cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      cy.contains('[data-cy^="datatable-row"]', '$10.00').should('exist');
    });
  });

  it('Can change the amount in a flexible contribution tier', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` }).then(() => {
      cy.getByDataCy('actions-menu-trigger').first().click();
      cy.contains('Update amount').click();
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Sponsor').within(() => {
        cy.get('input[type="radio"]').check();
      });
      cy.getByDataCy('tier-amount-select').click();
      cy.contains('[data-cy="select-option"]', '$250').click();
      cy.getByDataCy('recurring-contribution-update-order-button').click();
      cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      cy.contains('[data-cy^="datatable-row"]', '$250.00').should('exist');
    });
  });

  it('Can contribute a custom contribution amount', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` }).then(() => {
      cy.getByDataCy('actions-menu-trigger').first().click();
      cy.contains('Update amount').click();
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Sponsor').within(() => {
        cy.get('input[type="radio"]').check();
      });

      cy.getByDataCy('tier-amount-select', { timeout: 10000 }).should('be.visible');
      cy.getByDataCy('tier-amount-select').click();
      cy.contains('[data-cy="select-option"]', 'Other').click();
      cy.getByDataCy('recurring-contribution-tier-box').contains('Min. amount: $100.00');
      cy.getByDataCy('recurring-contribution-custom-amount-input').clear();
      cy.getByDataCy('recurring-contribution-custom-amount-input').type('150');

      cy.getByDataCy('recurring-contribution-update-order-button').scrollIntoView();
      cy.getByDataCy('recurring-contribution-update-order-button').click();
      cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      cy.contains('[data-cy^="datatable-row"]', '$150.00').should('exist');
    });
  });

  it('Cannot contribute a contribution amount less than the minimum allowable amount', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` }).then(() => {
      cy.getByDataCy('actions-menu-trigger').first().click();
      cy.contains('Update amount').click();
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Sponsor').within(() => {
        cy.get('input[type="radio"]').check();
      });

      cy.getByDataCy('tier-amount-select', { timeout: 10000 }).should('be.visible');
      cy.getByDataCy('tier-amount-select').click();
      cy.contains('[data-cy="select-option"]', 'Other').click();
      cy.getByDataCy('recurring-contribution-tier-box').contains('Min. amount: $100.00');
      cy.getByDataCy('recurring-contribution-custom-amount-input').type('{selectall}50');

      cy.getByDataCy('recurring-contribution-update-order-button').scrollIntoView();
      cy.getByDataCy('recurring-contribution-update-order-button').click();
      cy.getByDataCy('toast-notification').contains('Amount is less than minimum value allowed for this Tier.');
    });
  });

  it('Can cancel an active contribution with reasons displayed in modal, "other" displays text area', () => {
    cy.mailpitDeleteAllEmails();
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` }).then(() => {
      cy.getByDataCy('actions-menu-trigger').first().click();
      cy.getByDataCy('recurring-contribution-menu-cancel-option').click();
      cy.getByDataCy('cancel-order-modal').should('exist');
      cy.getByDataCy('cancel-order-modal').contains('Why are you cancelling your subscription today? 🥺');
      cy.getByDataCy('cancel-reason').should('exist');
      cy.getByDataCy('NO_LONGER_WANT_TO_SUPPORT').contains('No longer want to back the collective');
      cy.getByDataCy('UPDATING_ORDER').contains('Changing payment method or amount');
      cy.getByDataCy('cancellation-text-area').should('not.exist');
      cy.getByDataCy('OTHER').click();
      cy.getByDataCy('cancellation-text-area').clear();
      cy.getByDataCy('cancellation-text-area').type('Because I want to');
      cy.getByDataCy('recurring-contribution-cancel-yes').click();
      cy.getByDataCy('recurring-contribution-cancel-yes').then(() => {
        cy.getByDataCy('toast-notification').contains('Your recurring contribution has been cancelled');
        cy.getByDataCy('contribution-status').contains('Canceled');
      });
      cy.openEmail(({ Subject }) => Subject.includes(`Contribution cancelled to Test Collective`)).then(email => {
        const $html = cheerio.load(email.HTML);
        const emailBody = $html('body').text();
        expect(emailBody).to.include('Because I want to');
      });
    });
  });
});
