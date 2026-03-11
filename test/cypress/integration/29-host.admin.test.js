import { Sections } from '../../../components/collective-page/_constants';

import { randomSlug, randStr } from '../support/faker';

const scrollToSection = section => {
  // Wait for collective page to load before disabling smooth scroll
  cy.get('[data-cy=collective-page-main]');
  cy.get(`#section-${section}`).scrollIntoView();
};

describe('host dashboard', () => {
  let user;

  before(() => {
    cy.signup({ redirect: '/brusselstogetherasbl' }).then(u => (user = u));
  });

  describe('pending applications', () => {
    it('mark pending application approved', () => {
      const collectiveSlug = randomSlug();
      cy.get('[data-cy="host-apply-btn"]:visible').click();
      cy.getByDataCy('host-apply-modal-next').click();
      cy.getByDataCy('host-apply-collective-picker').click();
      cy.getByDataCy('host-apply-new-collective-link').click();
      cy.get(`input[name="name"]`).type('Cavies United');
      cy.get(`input[name="slug"]`).type(`{selectall}${collectiveSlug}`);
      cy.get(`input[name="description"]`).type('We will rule the world with our cute squeaks');
      cy.getByDataCy('checkbox-tos').click();
      cy.wait(300);
      cy.get('button[type="submit"]').click();
      cy.contains('Cavies United has been created!');
      cy.login({ redirect: '/dashboard/brusselstogetherasbl/host-applications' });
      cy.get('[data-cy="menu-item-host-applications"]').should('be.visible').click();
      cy.contains('Pending').click();
      cy.get(`[data-cy="${collectiveSlug}-table-actions"]`).click();
      cy.get(`[data-cy="${collectiveSlug}-view-details"]`).click();
      cy.get(`[data-cy="${collectiveSlug}-approve"]`).click();
      cy.contains(`[data-cy="host-application-header-${collectiveSlug}"]`, 'Approved');
    });
  });

  describe('unhost collectives', () => {
    it('unhost collective with zero balance', () => {
      cy.signup({ redirect: '/brusselstogetherasbl' });
      const collectiveSlug = randomSlug();
      cy.get('[data-cy="host-apply-btn"]:visible').click();
      cy.getByDataCy('host-apply-modal-next').click();
      cy.getByDataCy('host-apply-collective-picker').click();
      cy.getByDataCy('host-apply-new-collective-link').click();
      cy.get(`input[name="name"]`).type('Cavies United');
      cy.get(`input[name="slug"]`).type(`{selectall}${collectiveSlug}`);
      cy.get(`input[name="description"]`).type('We will rule the world with our cute squeaks');
      cy.getByDataCy('checkbox-tos').click();
      cy.get('button[type="submit"]').click();
      cy.contains('Cavies United has been created!');
      cy.login({ redirect: '/dashboard/brusselstogetherasbl/hosted-collectives' });
      cy.get('[data-cy="menu-item-host-applications"]').should('be.visible').click();
      cy.contains('Pending').click();
      cy.get(`[data-cy="${collectiveSlug}-table-actions"]`).click();
      cy.get(`[data-cy="${collectiveSlug}-view-details"]`).click();
      cy.get(`[data-cy="${collectiveSlug}-approve"]`).click();
      cy.contains(`[data-cy="host-application-header-${collectiveSlug}"]`, 'Approved');
      cy.get(`[data-cy="close-drawer"]`).click();
      cy.getByDataCy('menu-item-hosted-collectives').click();
      cy.getByDataCy(`collective-${collectiveSlug}`).within(() => {
        cy.getByDataCy('more-actions-btn').click();
      });
      cy.getByDataCy('actions-unhost').click();
      cy.get('textarea#unhost-account-message').type('Un-hosting this collective');
      cy.contains('button', 'Un-host Collective').click();
      cy.getByDataCy(`collective-${collectiveSlug}`).should('not.exist');
    });

    it('cannot unhost collective with balance', () => {
      cy.signup({ redirect: '/brusselstogetherasbl' });
      const collectiveSlug = randomSlug();
      cy.get('[data-cy="host-apply-btn"]:visible').click();
      cy.getByDataCy('host-apply-modal-next').click();
      cy.getByDataCy('host-apply-collective-picker').click();
      cy.getByDataCy('host-apply-new-collective-link').click();
      cy.get(`input[name="name"]`).type('Cavies United');
      cy.get(`input[name="slug"]`).type(`{selectall}${collectiveSlug}`);
      cy.get(`input[name="description"]`).type('We will rule the world with our cute squeaks');
      cy.getByDataCy('checkbox-tos').click();
      cy.get('button[type="submit"]').click();
      cy.contains('Cavies United has been created!');
      cy.login({ redirect: '/dashboard/brusselstogetherasbl/hosted-collectives' });
      cy.get('[data-cy="menu-item-host-applications"]').should('be.visible').click();
      cy.contains('Pending').click();
      cy.get(`[data-cy="${collectiveSlug}-table-actions"]`).click();
      cy.get(`[data-cy="${collectiveSlug}-view-details"]`).click();
      cy.get(`[data-cy="${collectiveSlug}-approve"]`).click();
      cy.contains(`[data-cy="host-application-header-${collectiveSlug}"]`, 'Approved');
      cy.get('[data-cy="close-drawer"]').click();
      cy.getByDataCy('menu-item-hosted-collectives').click();
      cy.getByDataCy(`collective-${collectiveSlug}`).within(() => {
        cy.getByDataCy('more-actions-btn').click();
      });
      cy.getByDataCy('actions-add-funds').click();
      cy.wait(300);
      cy.get('[data-cy="add-funds-amount"]').type('{selectall}20');
      cy.get('[data-cy="add-funds-description"]').type('cypress test - add funds');
      const vendorName = randStr();
      cy.get('[data-cy="add-funds-source"]').type(vendorName);
      cy.contains(`Create vendor: ${vendorName}`).click();
      cy.contains(`I confirm that`).click();
      cy.get('[data-cy="add-funds-submit-btn"]').click();

      cy.getByDataCy(`collective-${collectiveSlug}`).within(() => {
        cy.getByDataCy('more-actions-btn').click();
      });
      cy.getByDataCy('actions-unhost').click();

      cy.contains("The Collective's balance must be zero to un-host").should('exist');
      cy.contains('button', 'Un-host Collective').should('be.disabled');
      cy.contains('button', 'Cancel').click();
    });
  });

  describe('Pending `Contributions', () => {
    it('Create new pending contribution, edit it and mark it as paid', () => {
      // Create contribution
      cy.login({ redirect: '/dashboard/brusselstogetherasbl/expected-funds' });
      cy.get('[data-cy="create-pending-contribution"]:first').click();
      cy.get('[data-cy="create-pending-contribution-to"]:first').type('Veganizer');
      cy.contains('[data-cy=select-option]', 'Veganizer BXL').click();
      cy.get('[data-cy="create-pending-contribution-child"]:first').click();
      cy.contains('[data-cy=select-option]', 'None').click();
      cy.get('[data-cy="create-pending-contribution-source"]:first').type('Xavier');
      cy.contains('[data-cy=select-option]', 'Xavier').click();
      cy.get('[data-cy="create-pending-contribution-contact-name"]:first').type('Xavier');
      cy.get('[data-cy="create-pending-contribution-fromAccountInfo-email"').type('yourname@yourhost.com');
      cy.get('[data-cy="create-pending-contribution-amount"]:first').type('500');
      cy.get('input#CreatePendingContribution-hostFeePercent').type('5'); // 5%
      cy.get('[data-cy="create-pending-contribution-expectedAt"]:first').click();
      cy.contains('[data-cy=select-option]', '1 month').click();
      const description = `Generous donation ${randStr()}`;
      cy.getByDataCy('create-pending-contribution-description').type(description);
      cy.get('[data-cy="create-pending-contribution-submit-btn"]:first').click();
      cy.get('tbody tr').first().as('createdContribution');
      cy.get('@createdContribution').should('contain', 'Pending');
      cy.get('@createdContribution').should('contain', '€500.00');

      // Go to contribution page
      cy.get('tbody tr:first td button:last').first().click();
      cy.contains('View details').click();
      cy.contains(description).should('exist');
      cy.contains('More actions').click();

      // Mark as expired
      cy.getByDataCy('MARK_AS_EXPIRED-button').click();
      cy.contains('Mark as expired').click();
      cy.checkToast({ variant: 'success', message: 'The contribution has been marked as expired' });
      cy.contains('Expired').should('exist');

      cy.contains('More actions').click();

      // Mark as paid
      cy.getByDataCy('MARK_AS_PAID-button').click();
      cy.getByDataCy('amount-received').should('be.visible');

      // 1. With original amount, tip input should be disabled
      cy.getByDataCy('platform-tip').should('be.disabled');

      // 2. Change amount so tip input becomes enabled
      cy.getByDataCy('amount-received').clear().type('510');
      cy.getByDataCy('platform-tip').should('not.be.disabled');

      // 3. Change the tip
      cy.getByDataCy('platform-tip').clear().type('10');

      // 4. Restore original amount
      cy.getByDataCy('amount-received').clear().type('500');

      // 5. Tip should reset to default (0) and input disabled
      cy.getByDataCy('platform-tip').should('be.disabled');
      cy.getByDataCy('platform-tip')
        .invoke('val')
        .then(val => expect(parseFloat(val)).to.equal(0));

      // 6. Submit and verify amounts (contribution 500, processor 4, host fee 9% → 45)
      cy.getByDataCy('payment-processor-fee').clear().type('4');
      cy.getByDataCy('host-fee-percent').last().clear().type('9');
      cy.getByDataCy('order-confirmation-modal-submit').click();
      cy.contains('Paid').should('exist');

      cy.getByDataCy('view-transactions-button').click();
      cy.contains('Contribution').should('exist');
      cy.contains('€500.00').should('exist');
      cy.contains('Host fee').should('exist');
      cy.contains('€45.00').should('exist');
    });

    it('Mark as paid with modified amount and tip, verify transaction amounts', () => {
      // Create contribution (no platform tip)
      cy.login({ redirect: '/dashboard/brusselstogetherasbl/expected-funds' });
      cy.get('[data-cy="create-pending-contribution"]:first').click();
      cy.get('[data-cy="create-pending-contribution-to"]:first').type('Veganizer');
      cy.contains('[data-cy=select-option]', 'Veganizer BXL').click();
      cy.get('[data-cy="create-pending-contribution-child"]:first').click();
      cy.contains('[data-cy=select-option]', 'None').click();
      cy.get('[data-cy="create-pending-contribution-source"]:first').type('Xavier');
      cy.contains('[data-cy=select-option]', 'Xavier').click();
      cy.get('[data-cy="create-pending-contribution-contact-name"]:first').type('Xavier');
      cy.get('[data-cy="create-pending-contribution-fromAccountInfo-email"').type('yourname@yourhost.com');
      cy.get('[data-cy="create-pending-contribution-amount"]:first').type('500');
      cy.get('input#CreatePendingContribution-hostFeePercent').type('5');
      cy.get('[data-cy="create-pending-contribution-expectedAt"]:first').click();
      cy.contains('[data-cy=select-option]', '1 month').click();
      const description = `Modified amount and tip ${randStr()}`;
      cy.getByDataCy('create-pending-contribution-description').type(description);
      cy.get('[data-cy="create-pending-contribution-submit-btn"]:first').click();
      cy.get('tbody tr').first().as('createdContribution');
      cy.get('@createdContribution').should('contain', 'Pending');

      cy.get('tbody tr:first td button:last').first().click();
      cy.contains('View details').click();
      cy.contains(description).should('exist');
      cy.contains('More actions').click();
      cy.getByDataCy('MARK_AS_PAID-button').click();
      cy.getByDataCy('amount-received').should('be.visible');

      // Change amount so tip is editable, set tip and fees, submit with modified values
      cy.getByDataCy('amount-received').clear().type('514'); // 500 + 10 tip + 4 processor
      cy.getByDataCy('platform-tip').clear().type('10');
      cy.getByDataCy('payment-processor-fee').clear().type('4');
      cy.getByDataCy('host-fee-percent').last().clear().type('9');
      cy.getByDataCy('order-confirmation-modal-submit').click();
      cy.contains('Paid').should('exist');

      // Verify transaction amounts: contribution 504 (514 - 10), platform tip 10, processor fee 4, host fee 9% of 504 = 45.36
      cy.getByDataCy('view-transactions-button').click();
      cy.contains('Contribution').should('exist');
      cy.contains('€504.00').should('exist'); // amount received - platform tip
      cy.contains('€10.00').should('exist'); // platform tip
      cy.contains('Host fee').should('exist');
      cy.contains('€45.36').should('exist');
    });
  });

  describe('expenses tab', () => {
    before(() => {
      // 207 - BrusselsTogether
      cy.createExpense({
        userEmail: user.email,
        account: { legacyId: 207 },
        payee: { id: user.id },
      }).as('expense');
    });

    it('Process host expense', () => {
      cy.get('@expense').then(expense => {
        cy.login({ redirect: `/brusselstogether/expenses/${expense.legacyId}` });
      });

      // Defaults to pending, approve it
      cy.contains('More actions').click();
      cy.contains('Approve').click();
      cy.getByDataCy('expense-status-msg').contains('Approved');
      cy.visit(
        '/dashboard/brusselstogetherasbl/pay-disbursements?sort[field]=CREATED_AT&sort[direction]=DESC&status=ALL',
      );
      cy.get('@expense').then(expense => {
        cy.getByDataCy(`expense-container-${expense.legacyId}`).as('currentExpense');
      });

      // Unapprove
      cy.get('@currentExpense').find('[data-cy="request-re-approval-button"]').click();
      cy.contains('Confirm and request re-approval').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Pending');

      // Approve

      cy.get('@expense').then(expense => {
        cy.login({ redirect: `/brusselstogether/expenses/${expense.legacyId}` });
      });

      // Defaults to pending, approve it
      cy.contains('More actions').click();
      cy.contains('Approve').click();
      cy.getByDataCy('expense-status-msg').contains('Approved');

      cy.visit(
        '/dashboard/brusselstogetherasbl/pay-disbursements?sort[field]=CREATED_AT&sort[direction]=DESC&status=ALL',
      );
      cy.get('@expense').then(expense => {
        cy.getByDataCy(`expense-container-${expense.legacyId}`).as('currentExpense');
      });

      cy.get('@currentExpense').find('[data-cy="pay-button"]').click();
      // Pay
      cy.getByDataCy('pay-expense-modal').as('payExpenseModal');
      cy.get('@payExpenseModal').find('[data-cy="pay-type-MANUAL"]').click();
      cy.get('@payExpenseModal').find('[data-cy="expense-amount-paid"]').type('10.00');
      cy.get('@payExpenseModal').find('[data-cy="mark-as-paid-button"]').click();
      cy.get('@currentExpense').find('[data-cy="admin-expense-status-msg"]').contains('Paid');

      // Mark as unpaid
      cy.get('@currentExpense').find('[data-cy="admin-expense-status-msg"]').click();
      cy.getByDataCy('mark-as-unpaid-button').click();
      cy.getByDataCy('mark-expense-as-unpaid-modal').as('markAsUnpaidModal');
      cy.get('@markAsUnpaidModal').find('[data-cy="confirmation-modal-continue"]').click();
      cy.get('@currentExpense').find('[data-cy="admin-expense-status-msg"]').contains('Approved');

      // Unapprove
      cy.get('@currentExpense').find('[data-cy="request-re-approval-button"]').click({ force: true });
      cy.contains('Confirm and request re-approval').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Pending');
    });
  });

  describe('Add funds modal', () => {
    it('Cannot submit incomplete form', () => {
      cy.login({ redirect: '/dashboard/brusselstogetherasbl/hosted-collectives' });
      cy.getByDataCy(`collective-brusselstogether`).within(() => {
        cy.getByDataCy('more-actions-btn').click();
      });
      cy.getByDataCy('actions-add-funds').click();
      cy.get('[data-cy="add-funds-submit-btn"]').click();
      cy.contains('[data-cy="add-funds-form"]', 'This field is required');
    });

    it.skip('Can add funds and platform tip as collective host', () => {
      cy.login({ redirect: '/dashboard/brusselstogetherasbl/hosted-collectives' });
      cy.get('[data-cy="hosted-collective-add-funds-btn"]').first().click();
      cy.wait(300);
      cy.get('[data-cy="add-funds-amount"]').type('20');
      cy.get('[data-cy="add-funds-description"]').type('cypress test - add funds');
      cy.get('[data-cy="add-funds-source"]').click();
      cy.get('[data-cy="collective-type-picker-USER"]').click();
      cy.get('[data-cy="mini-form-email-field"]').type('cypress-test@funds.com');
      cy.get('[data-cy="mini-form-name-field"]').type('cypress user');
      cy.get('[data-cy="collective-mini-form-scroll"]').scrollTo('bottom', { duration: 5000 });
      cy.get('[data-cy="mini-form-save-button"]').click();
      cy.wait(1000);
      cy.get('[data-cy="add-funds-submit-btn"]').click();
      cy.wait(300);
      cy.get('[data-cy="funds-added"]').contains('Funds Added ✅');
      cy.contains('[data-cy="donation-percentage"]', 'No thank you').click();
      cy.contains('[data-cy="select-option"]', '€2.00').click();
      cy.get('[data-cy="add-platform-tip-btn"]').contains('Tip and Finish');
      cy.get('[data-cy="add-platform-tip-btn"]').click();
      cy.wait(300);
      cy.get('[data-cy="collective-avatar"]').first().click();
      scrollToSection(Sections.BUDGET);
      cy.get('[data-cy="section-budget"]').contains('cypress test - add funds');
      cy.visit('opencollectivehost');
      scrollToSection(Sections.TRANSACTIONS);
      cy.get('[data-cy="section-transactions"]').contains('Financial contribution to Open Collective');
    });
  });
});
