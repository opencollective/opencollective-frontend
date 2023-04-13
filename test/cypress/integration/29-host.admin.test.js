import { Sections } from '../../../components/collective-page/_constants';

import { randomSlug } from '../support/faker';

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
      cy.login({ redirect: '/brusselstogetherasbl/admin' });
      cy.get('[data-cy="menu-item-pending-applications"]').click();
      cy.get(`[data-cy="${collectiveSlug}-approve"]`).click();
      cy.contains(`[data-cy="host-application"]`, 'Approved');
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
      cy.login({ redirect: '/brusselstogetherasbl/admin' });
      cy.get('[data-cy="menu-item-pending-applications"]').click();
      cy.get(`[data-cy="${collectiveSlug}-approve"]`).click();
      cy.contains(`[data-cy="host-application"]`, 'Approved');
      cy.getByDataCy('menu-item-hosted-collectives').click();
      cy.getByDataCy(`${collectiveSlug}-collective-card`).within(() => {
        cy.get('button[title="More options"]').click();
        cy.contains('button', 'Un-host').click();
      });
      cy.get('textarea#unhost-account-message').type('Un-hosting this collective');
      cy.contains('button', 'Un-host Collective').click();
      cy.getByDataCy(`${collectiveSlug}-collective-card`).should('not.exist');
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
      cy.login({ redirect: '/brusselstogetherasbl/admin' });
      cy.get('[data-cy="menu-item-pending-applications"]').click();
      cy.get(`[data-cy="${collectiveSlug}-approve"]`).click();
      cy.contains(`[data-cy="host-application"]`, 'Approved');
      cy.getByDataCy('menu-item-hosted-collectives').click();
      cy.getByDataCy(`${collectiveSlug}-collective-card`).within(() => {
        cy.get('[data-cy="hosted-collective-add-funds-btn"]').click();
      });

      cy.get('[data-cy="add-funds-amount"]').type('20');
      cy.get('[data-cy="add-funds-description"]').type('cypress test - add funds');
      cy.get('[data-cy="add-funds-source"]').type(collectiveSlug);
      cy.contains(`@${collectiveSlug}`).click();
      cy.get('[data-cy="add-funds-submit-btn"]').click();
      cy.contains('button', 'Finish').click();
      cy.contains('button', 'Finish').should('not.exist');

      cy.getByDataCy(`${collectiveSlug}-collective-card`).within(() => {
        cy.get('button[title="More options"]').click();
        cy.contains('button', 'Un-host').click();
      });

      cy.contains("The Collective's balance must be zero to un-host").should('exist');
      cy.contains('button', 'Un-host Collective').should('be.disabled');
      cy.contains('button', 'Cancel').click();
    });
  });

  describe('Orders', () => {
    it('edit order and mark as paid', () => {
      cy.login({ redirect: '/brusselstogetherasbl/admin/orders' });
      cy.get('[data-cy="MARK_AS_PAID-button"]:first').click();
      cy.get('[data-cy="amount-received"]').type('10.23');
      cy.get('[data-cy="platform-tip"]').type('1.20');
      cy.getByDataCy('order-confirmation-modal-submit').click();
      cy.contains('span', '9.03');
      cy.contains('[data-cy="order-status-msg"]:first', 'Paid');
    });
  });

  describe('Pending `Contributions', () => {
    it('Create new pending contribution', () => {
      cy.login({ redirect: '/brusselstogetherasbl/admin/pending-contributions' });
      cy.get('[data-cy="create-pending-contribution"]:first').click();
      cy.get('[data-cy="create-pending-contribution-to"]:first').type('Veganizer');
      cy.wait(2000);
      cy.contains('[data-cy=select-option]', 'Veganizer BXL').click();
      cy.get('[data-cy="create-pending-contribution-child"]:first').click();
      cy.contains('[data-cy=select-option]', 'None').click();
      cy.get('[data-cy="create-pending-contribution-source"]:first').type('Xavier');
      cy.wait(2000);
      cy.contains('[data-cy=select-option]', 'Xavier').click();
      cy.get('[data-cy="create-pending-contribution-contact-name"]:first').type('Xavier');
      cy.get('[data-cy="create-pending-contribution-fromAccountInfo-email"').type('yourname@yourhost.com');
      cy.get('[data-cy="create-pending-contribution-amount"]:first').type('500');
      cy.get('[data-cy="create-pending-contribution-expectedAt"]:first').click();
      cy.contains('[data-cy=select-option]', '1 month').click();
      cy.get('[data-cy="create-pending-contribution-submit-btn"]:first').click();
      cy.wait(2000);
      cy.get('[data-cy="expense-title"]:first').click();
      cy.contains('[data-cy="expense-description"]', 'Financial contribution to Veganizer BXL');
      cy.get('[data-cy="MARK_AS_EXPIRED-button"]:first').click();
      cy.get('[data-cy="confirmation-modal-continue"]:first').click();
      cy.contains('[data-cy="order-status-msg"]', 'Expired');
      cy.get('[data-cy="MARK_AS_PAID-button"]:first').click();
      cy.get('[data-cy="payment-processor-fee"]').clear().type('4');
      cy.get('[data-cy="platform-tip"]').clear().type('10');
      cy.get('[data-cy="host-fee-percent"]').clear().type('9');
      cy.getByDataCy('order-confirmation-modal-submit').click();
      cy.contains('span', '€490.00');
      cy.contains('span', '-€44.10');
      cy.contains('[data-cy="order-status-msg"]:first', 'Paid');
    });
  });

  describe('expenses tab', () => {
    let expense;

    before(() => {
      // 207 - BrusselsTogether
      cy.createExpense({
        userEmail: user.email,
        account: { legacyId: 207 },
        payee: { legacyId: user.CollectiveId },
      }).then(e => (expense = e));
    });

    it('Process expense', () => {
      cy.login({ redirect: '/brusselstogetherasbl/admin/expenses' });
      cy.getByDataCy(`expense-container-${expense.legacyId}`).as('currentExpense');

      // Defaults to pending, approve it
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Pending');
      cy.get('@currentExpense').find('[data-cy="approve-button"]').click();
      cy.get('@currentExpense').find('[data-cy="admin-expense-status-msg"]').contains('Approved');

      // Unapprove
      cy.get('@currentExpense').find('[data-cy="unapprove-button"]').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Pending');

      // Approve
      cy.get('@currentExpense').find('[data-cy="approve-button"]').click();
      cy.get('@currentExpense').find('[data-cy="admin-expense-status-msg"]').contains('Approved');

      // Security Check
      cy.get('@currentExpense').find('[data-cy="pay-button"]').click();
      cy.getByDataCy('security-check-modal').as('securityCheckModal');
      cy.get('@securityCheckModal').find('h1').contains('Are you sure you want to pay?');
      cy.get('@securityCheckModal').find('[data-cy="pay-button"]').click();

      // Pay
      cy.getByDataCy('pay-expense-modal').as('payExpenseModal');
      cy.get('@payExpenseModal').find('[data-cy="pay-type-MANUAL"]').click();
      cy.get('@payExpenseModal').find('[data-cy="total-amount-paid"]').type('10.23');
      cy.get('@payExpenseModal').find('[data-cy="mark-as-paid-button"]').click();
      cy.get('@currentExpense').find('[data-cy="admin-expense-status-msg"]').contains('Paid');

      // Mark as unpaid
      cy.get('@currentExpense').find('[data-cy="admin-expense-status-msg"]').click();
      cy.getByDataCy('mark-as-unpaid-button').click();
      cy.getByDataCy('mark-expense-as-unpaid-modal').as('markAsUnpaidModal');
      cy.get('@markAsUnpaidModal').find('[data-cy="confirmation-modal-continue"]').click();
      cy.get('@currentExpense').find('[data-cy="admin-expense-status-msg"]').contains('Approved');

      // Unapprove
      cy.get('@currentExpense').find('[data-cy="unapprove-button"]').click();
      cy.get('@currentExpense').find('[data-cy="expense-status-msg"]').contains('Pending');

      // Reject
      cy.get('@currentExpense').find('[data-cy="reject-button"]').click();
      cy.get('@currentExpense').find('[data-cy="admin-expense-status-msg"]').contains('Rejected');
    });
  });

  describe('Add funds modal', () => {
    it('Cannot submit incomplete form', () => {
      cy.login({ redirect: '/brusselstogetherasbl/admin/hosted-collectives' });
      cy.get('[data-cy="hosted-collective-add-funds-btn"]').first().click();
      cy.getByDataCy('add-funds-submit-btn').click();
      cy.contains('[data-cy="add-funds-form"]', 'This field is required');
    });

    it.skip('Can add funds and platform tip as collective host', () => {
      cy.login({ redirect: '/brusselstogetherasbl/admin/hosted-collectives' });
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
