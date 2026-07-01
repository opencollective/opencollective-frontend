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
      cy.get('[data-cy^="datatable-row"]').should('have.length', 1);

      // Filter by Yearly frequency
      cy.getByDataCy('add-filter').click();
      cy.contains('Frequency').click();
      cy.contains('[data-cy="combo-select-option"]', 'Yearly').click();
      cy.getByDataCy('apply-filter').should('not.be.disabled');
      cy.getByDataCy('apply-filter').click();
      cy.getByDataCy('filter-frequency').should('exist');
      // Wait for the filtered query to finish loading. While loading, the table shows skeleton
      // rows without data-cy attributes; when loading completes with no results, the table is
      // replaced by EmptyResults, which can close an open filter popover.
      cy.getByDataCy('zero-results-message').should('exist');

      // Filter by Monthly frequency
      cy.getByDataCy('filter-frequency').click();
      cy.getByDataCy('combo-select-input').should('be.visible');
      cy.contains('[data-cy="combo-select-option"]', 'Monthly').click();
      cy.getByDataCy('apply-filter').should('not.be.disabled');
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
          cy.wait(500);
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
      cy.contains('Update contribution amount').click();
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
      cy.contains('Update contribution amount').click();
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
      cy.contains('Update contribution amount').click();
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Sponsor').within(() => {
        cy.get('input[type="radio"]').check();
      });

      cy.wait(250);
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
      cy.contains('Update contribution amount').click();
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Sponsor').within(() => {
        cy.get('input[type="radio"]').check();
      });

      cy.wait(250);
      cy.getByDataCy('tier-amount-select').click();
      cy.contains('[data-cy="select-option"]', 'Other').click();
      cy.getByDataCy('recurring-contribution-tier-box').contains('Min. amount: $100.00');
      cy.getByDataCy('recurring-contribution-custom-amount-input').clear().type('150');

      cy.getByDataCy('recurring-contribution-update-order-button').scrollIntoView().click();
      cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      cy.contains('[data-cy^="datatable-row"]', '$150.00').should('exist');
    });
  });

  it('Cannot contribute a contribution amount less than the minimum allowable amount', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` }).then(() => {
      cy.getByDataCy('actions-menu-trigger').first().click();
      cy.contains('Update contribution amount').click();
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Sponsor').within(() => {
        cy.get('input[type="radio"]').check();
      });

      cy.wait(250);
      cy.getByDataCy('tier-amount-select').click();
      cy.contains('[data-cy="select-option"]', 'Other').click();
      cy.getByDataCy('recurring-contribution-tier-box').contains('Min. amount: $100.00');
      cy.getByDataCy('recurring-contribution-custom-amount-input').type('{selectall}50');

      cy.getByDataCy('recurring-contribution-update-order-button').scrollIntoView().click();
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
      cy.getByDataCy('cancellation-text-area').clear().type('Because I want to');
      cy.getByDataCy('recurring-contribution-cancel-yes')
        .click()
        .then(() => {
          cy.getByDataCy('toast-notification').contains('Your recurring contribution has been cancelled');
          cy.getByDataCy('contribution-status').contains('Canceled');
        });
      cy.openEmail(({ Subject }) => Subject.includes(`Contribution to Test Collective cancelled`)).then(email => {
        const $html = cheerio.load(email.HTML);
        const emailBody = $html('body').text();
        expect(emailBody).to.include('Because I want to');
      });
    });
  });
});

describe('Recurring contributions: update platform tip', () => {
  let user;
  let collective;

  before(() => {
    cy.intercept('GET', 'https://js.stripe.com/dahlia/stripe.js', req => {
      req.continue(res => {
        res.body = res.body.replaceAll('window.top.location.href', 'window.location.href');
      });
    });

    // Host on the Open Source Collective with platform tips enabled. This host renders the
    // legacy Stripe card element, so we can reuse the same proven `useAnyPaymentMethod` flow as
    // the first describe block above instead of the real Stripe Payment Element (which redirects
    // and can hang the recurring checkout).
    cy.createHostedCollectiveV2({ skipApproval: true, testPayload: { data: { platformTips: true } } }).then(c => {
      collective = c;
      cy.signup({ redirect: `/${collective.slug}/donate` }).then(u => {
        user = u;
        // Details step: pick monthly, keep the default 15% platform tip
        cy.get('#interval > :nth-child(2)').click();
        cy.get('button[data-cy="cf-next-step"]').click();
        // Profile step: keep the preselected personal profile. The legal name is required
        // because the tip brings the yearly total over the contributor info threshold.
        cy.contains('Contribute as');
        cy.getByDataCy('input-legalName').type('Very Legal Name');
        cy.get('button[data-cy="cf-next-step"]').click();
        // Payment step: reuse an existing test payment method (no real Stripe)
        cy.useAnyPaymentMethod();
        cy.contains('button', 'Contribute').click();
        cy.getByDataCy('order-success');
      });
    });
  });

  it('Can switch the tip to a different preset percentage', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` });
    cy.getByDataCy('actions-menu-trigger').first().click();
    cy.contains('Update platform tip amount').click();

    cy.contains('[data-cy="platform-tip-options"] button', '20%').click();
    cy.contains('[data-cy="platform-tip-options"] button', '20%').should('have.class', 'selected');

    cy.getByDataCy('recurring-contribution-update-platform-tip-button').click();
    cy.getByDataCy('toast-notification').contains('Your recurring contribution platform tip has been updated.');
  });

  it('Can set a custom tip amount', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` });
    cy.getByDataCy('actions-menu-trigger').first().click();
    cy.contains('Update platform tip amount').click();

    cy.contains('[data-cy="platform-tip-options"] button', 'Custom').click();
    cy.getByDataCy('platform-tip-other-amount').clear().type('5');

    cy.getByDataCy('recurring-contribution-update-platform-tip-button').click();
    cy.getByDataCy('toast-notification').contains('Your recurring contribution platform tip has been updated.');
  });

  it('Can opt out of the platform tip', () => {
    cy.login({ email: user.email, redirect: `/dashboard/${user.collective.slug}/outgoing-contributions` });
    cy.getByDataCy('actions-menu-trigger').first().click();
    cy.contains('Update platform tip amount').click();

    cy.contains(`I don't want to add a contribution to the Open Collective platform`).click();

    cy.getByDataCy('recurring-contribution-update-platform-tip-button').click();
    cy.getByDataCy('toast-notification').contains('Your recurring contribution platform tip has been updated.');
  });
});
