describe('Host agreements', () => {
  it('Use the agreements admin to create and edit agreements', () => {
    // ---- Load the list filter by newly created account ----
    cy.login({ redirect: `/dashboard/brusselstogetherasbl/host-agreements` });
    cy.contains('[data-cy="zero-results-message"]', 'No agreements');

    // ---- Create an agreement ----
    cy.getByDataCy('btn-new-agreement').click();
    cy.getByDataCy('agreement-form').as('agreementForm');
    cy.contains('button', 'Create Agreement').click();
    // Submitting an empty form should trigger validation
    cy.get('@agreementForm').find('[data-cy="InputField-account"]').contains('This field is required');
    cy.get('@agreementForm').find('[data-cy="InputField-title"]').contains('This field is required');
    // Fill the form
    cy.get('@agreementForm').find('#input-account').type('veganizer');
    cy.contains('[data-cy="select-option"]', 'Veganizer BXL').click();
    cy.get('@agreementForm').find('#input-title').type('Unlimited potatoes');
    cy.get('@agreementForm').find('#input-expiresAt').type('2062-11-06');
    cy.get('@agreementForm')
      .find('#input-notes')
      .type('This group can expense an unlimited number of potatoes\n\nNo restrictions whatsoever.');
    // Submit
    cy.contains('button', 'Create Agreement').click();
    cy.checkToast({ variant: 'success', message: 'Agreement created' });
    cy.getByDataCy('agreement-drawer').should('not.exist'); // It closes the drawer

    // ---- Check agreement in the list ----
    cy.get('[data-cy="agreements-table"] tbody tr').first().as('firstRow');
    cy.get('@firstRow').contains('Veganizer BXL');
    cy.get('@firstRow').contains('Unlimited potatoes');
    cy.get('@firstRow').contains('Nov 6, 2062');

    // ---- Open drawer, make sure the info is there ----
    cy.get('@firstRow').find('td:nth-child(2)').click();
    cy.getByDataCy('agreement-drawer').contains('Veganizer BXL');
    cy.getByDataCy('agreement-drawer').contains('Unlimited potatoes');
    cy.getByDataCy('agreement-drawer').contains('November 6, 2062');
    cy.getByDataCy('agreement-drawer').contains('This group can expense an unlimited number of potatoes');

    // ---- Edit the agreement ----
    cy.getByDataCy('agreement-drawer').find('button[data-cy="btn-edit-agreement"]').click();
    cy.getByDataCy('agreement-form').as('agreementForm');
    cy.get('@agreementForm').find('#input-title').clear().type('Unlimited potatoes (updated)');
    cy.get('@agreementForm').find('#input-expiresAt').clear().type('2062-11-07');
    cy.contains('button', 'Save Changes').click();
    cy.checkToast({ variant: 'success', message: 'Agreement updated' });
    cy.getByDataCy('agreement-drawer').should('not.exist'); // It closes the drawer
    cy.get('@firstRow').contains('Unlimited potatoes (updated)');
    cy.get('@firstRow').contains('Nov 7, 2062');

    // ---- Filters the agreements ----
    cy.getByDataCy('filter-account').click();
    cy.getByDataCy('combo-select-input').click().type('brussels');
    // cy.getByDataCy('select-agreements-account').type('brussels');
    cy.contains('[data-cy="combo-select-option"]', 'BrusselsTogether').click();
    cy.getByDataCy('apply-filter').click();
    cy.contains('[data-cy="zero-results-message"]', 'No matching agreements');
    cy.contains('[data-cy="zero-results-message"] button', 'Reset filters').click(); // Has link to reset the (account) filter
    cy.contains('[data-cy="agreements-table"]', 'Unlimited potatoes (updated)');

    // ---- Agreement count should be displayed in the expenses list ----
    cy.getByDataCy('menu-item-Expenses').click(); // opening the Expenses menu group (that opens the 'Host expenses' page by default)
    cy.contains('[data-cy="expense-container-2340"]', 'Vegan Dining Week Client Dinner').as('expense');
    cy.get('@expense')
      .find('a[href="/dashboard/brusselstogetherasbl/host-agreements?account=veganizerbxl"]')
      .contains('1 agreement');

    // ---- Agreement count should be displayed on the expense ----
    cy.get('@expense').find('[data-cy="expense-title"]').click();
    cy.getByDataCy('expense-drawer').should('be.visible'); // Wait for the page to load
    cy.getByDataCy('expense-summary-collective').contains('Host Agreements: 1');
    cy.getByDataCy('expense-summary-collective')
      .find('a[href="/dashboard/brusselstogetherasbl/host-agreements?account=veganizerbxl"]')
      .click();

    // ---- Delete the agreements ----
    cy.contains('[data-cy="agreements-table"] tbody tr', 'Unlimited potatoes (updated)').first().as('firstRow');
    cy.get('@firstRow').find('td:nth-child(2)').click();
    cy.getByDataCy('agreement-drawer').find('button[data-cy="more-actions"]').click();
    cy.getByDataCy('more-actions-delete-expense-btn').click();
    cy.contains('This will permanently delete the agreement and all its attachments').should('be.visible');
    cy.getByDataCy('confirmation-modal-continue').click();
    cy.checkToast({ variant: 'success', message: 'Agreement deleted successfully' });
    cy.getByDataCy('agreement-drawer').should('not.exist'); // It closes the drawer
    cy.contains('[data-cy="zero-results-message"]', 'No matching agreements');
  });
});
