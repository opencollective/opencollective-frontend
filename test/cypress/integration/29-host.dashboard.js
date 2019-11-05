describe('host dashboard', () => {
  it('mark pending order as paid', () => {
    cy.login({ redirect: '/brusselstogetherasbl/dashboard/donations' });
    cy.get('.Orders .item:first .status').contains('pending');
    cy.get('.MarkOrderAsPaidBtn button')
      .first()
      .click();
    cy.get('.Orders .item:first .status').contains('paid');
    cy.wait(1000);
  });
});
