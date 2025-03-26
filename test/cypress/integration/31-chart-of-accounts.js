describe('Chart of Accounts', () => {
  let user;
  let host;

  before(() => {
    cy.signup().then(u => {
      user = u;
      cy.createHostOrganization(user.email).then(returnedAccount => {
        host = returnedAccount;
        cy.visit(`/dashboard/${host.slug}/chart-of-accounts`);
      });
    });
  });

  it('should support all chart of accounts operations', () => {
    // Create category
    cy.contains('button', 'Create category').click();

    // Fill form
    cy.get('[data-cy=InputField-code]').type('007');
    cy.get('[data-cy=InputField-name]').type('Workspace');
    cy.get('[data-cy=InputField-friendlyName]').type('Workspace Expenses');

    // Submit form
    cy.get('[data-cy=create-category-button]').contains('Create category').click();

    // Create category
    cy.contains('button', 'Create category').click();

    // Fill form
    cy.get('[data-cy=InputField-code]').type('008');
    cy.get('[data-cy=InputField-name]').type('Contractors');
    cy.get('[data-cy=InputField-friendlyName]').type('Contractor Expenses');

    // Submit form
    cy.get('[data-cy=create-category-button]').contains('Create category').click();

    // Verify categories are added
    cy.contains('Workspace Expenses');
    cy.contains('Contractor Expenses');

    // Test filtering by kind
    cy.get('[data-cy=add-filter]').click();
    cy.get('[data-value="Kind"]').click();
    cy.contains('Added Funds').click();
    cy.get('[data-cy=apply-filter]').click();
    cy.get('[data-cy=apply-filter]').should('not.exist');
    cy.contains('No chart of accounts');

    cy.get('[data-cy=filter-kind]').click();
    cy.get('[data-cy=combo-select-option]').contains('Expenses').click();
    cy.get('[data-cy=apply-filter]').click();
    cy.contains('Workspace Expenses');

    // Clear filtering by kind
    cy.get('[data-cy=remove-filter-kind]').click();
    cy.contains('Workspace Expenses');
    cy.contains('Contractor Expenses');

    // Test filtering by visibility
    cy.get('[data-cy=add-filter]').click();
    cy.get('[data-value="Visible only to host admins"]').click();
    cy.get('[data-cy=combo-select-option]').contains('Yes').click();
    cy.get('[data-cy=apply-filter]').click();
    cy.get('[data-cy=apply-filter]').should('not.exist');
    cy.contains('No chart of accounts');

    cy.get('[data-cy=filter-hostOnly]').click();
    cy.get('[data-cy=combo-select-option]').contains('No').click();
    cy.get('[data-cy=apply-filter]').click();
    cy.contains('Workspace Expenses');

    // Clear filtering by visibility
    cy.get('[data-cy=remove-filter-hostOnly]').click();
    cy.contains('Workspace Expenses');
    cy.contains('Contractor Expenses');

    // Test search by code
    cy.get('[data-cy=admin-panel-container] input').type('007');
    cy.contains('Workspace Expenses');
    cy.contains('Contractor Expenses').should('not.exist');

    cy.get('[data-cy=admin-panel-container] input').clear().type('009');
    cy.contains('No chart of accounts');

    // Test search by name
    cy.get('[data-cy=admin-panel-container] input').clear().type('Workspace');
    cy.contains('Workspace Expenses');
    cy.contains('Contractor Expenses').should('not.exist');

    // Test search by friendly name
    cy.get('[data-cy=admin-panel-container] input').clear().type('Contractor Expenses');
    cy.contains('Contractor Expenses');
    cy.contains('Workspace Expenses').should('not.exist');

    cy.get('[data-cy=admin-panel-container] input').clear();

    // Test sorting by code
    cy.contains('Code ascending').should('exist');
    cy.get('tr:nth-child(1)').contains('007');
    cy.get('tr:nth-child(2)').contains('008');

    cy.contains('Code ascending').click();
    cy.contains('Code descending').click();
    cy.get('tr:nth-child(1)').contains('008');
    cy.get('tr:nth-child(2)').contains('007');

    // Test sorting by name
    cy.contains('Code descending').click();
    cy.contains('Name ascending').click();
    cy.get('tbody tr:nth-child(1)').contains('Contractors');
    cy.get('tbody tr:nth-child(2)').contains('Workspace');

    cy.contains('Name ascending').click();
    cy.contains('Name descending').click();
    cy.get('tbody tr:nth-child(1)').contains('Workspace');
    cy.get('tbody tr:nth-child(2)').contains('Contractors');

    // Open and verify drawer
    cy.get('tbody tr:nth-child(1)').click();
    cy.contains('Accounting code');
    cy.contains('007');
    cy.contains('Category name');
    cy.contains('Applies to');

    // Test category deletion
    cy.contains('button', 'More actions').click();
    cy.contains('Delete').click();
    cy.get('[data-cy=confirmation-modal-continue]').click();
    cy.get('tr:nth-child(1)').contains('008');
  });
});
