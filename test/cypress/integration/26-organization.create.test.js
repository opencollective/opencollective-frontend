describe('create an organization', () => {
  before(() => {
    cy.login({ redirect: '/organizations/new' });
  });

  it('edit info', () => {
    cy.fillInputField('name', 'New org');
    cy.fillInputField('description', 'short description for new org');
    cy.fillInputField('website', 'https://newco.com');
    cy.get('.tos input[name="tos"]').click();
    cy.wait(500);
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.containsInDataCy('collective-title', 'New org', { timeout: 10000 });
    cy.get('[data-cy="collective-hero"] [title="Website"][href="https://newco.com"]');
    cy.get('.NotificationBar h1').contains('Your Organization has been created.');
  });
});
