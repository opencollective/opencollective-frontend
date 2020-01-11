describe('user profile page', () => {
  it('shows the collectives backed by the user', () => {
    cy.visit('/xdamman/legacy');
    cy.get('#backer');
    cy.get('#admin.organization [data-cy=subtitle]').contains("I'm an admin of these 2 Organizations");
    cy.get('#admin.organization .CollectiveCard').should('have.length', 2);
    cy.get('#admin.collective [data-cy=subtitle]').contains("I'm a Core Contributor and admin of these 2 Collectives");
    cy.get('#admin.collective .CollectiveCard').should('have.length', 2);
    cy.get('#backer .CollectiveCard').should('have.length', 4);
    cy.get('#backer .CollectiveCard')
      .first()
      .find('.totalDonations')
      .contains('€5,140');
    cy.get('#attendee .CollectiveCard').should('have.length', 2);
  });
});
