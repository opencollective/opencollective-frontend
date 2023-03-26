describe('widgets', () => {
  it('shows the collectives hosted by the host', () => {
    cy.visit('/brusselstogetherasbl/collectives.html?role=host');
    cy.get('.CollectiveCard').its('length').should('be.gt', 1);
  });

  it('shows the collectives backed by a user', () => {
    cy.visit('/xdamman/widget.html');
    cy.get('.CollectiveCard').should('have.length', 12);
  });
});
