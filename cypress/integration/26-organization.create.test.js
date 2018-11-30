describe('create an organization', () => {
  before(() => {
    cy.login({ redirect: '/organizations/new' });
  });

  it('edit info', () => {
    cy.fillInputField('name', 'New org');
    cy.fillInputField('description', 'short description for new org');
    cy.fillInputField('website', 'https://newco.com');
    cy.get('.tos input[name="tos"]').click({ force: true });
    cy.wait(500);
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.get('.UserCollectivePage .CollectiveCover h1', {
      timeout: 10000,
    }).contains('New org');
    cy.get('.UserCollectivePage .CollectiveCover .website').contains('newco.com');
    cy.get('.NotificationBar h1').contains('success');
  });
});
