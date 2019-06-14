describe('user profile page', () => {
  it('shows the collectives backed by the user', () => {
    cy.visit('/xdamman');
    cy.get('#backer');
    cy.get('#admin.organization [data-cy=subtitle]').contains("I'm an administrator of these 2 organizations");
    cy.get('#admin.organization .CollectiveCard').should('have.length', 2);
    cy.get('#admin.collective [data-cy=subtitle]').contains("I'm a core contributor of these 2 collectives");
    cy.get('#admin.collective .CollectiveCard').should('have.length', 2);
    cy.get('#backer .CollectiveCard').should('have.length', 3);
    cy.get('#backer .CollectiveCard')
      .first()
      .find('.totalDonations')
      .contains('€5,140');
    cy.get('#attendee .CollectiveCard').should('have.length', 2);
  });
});
