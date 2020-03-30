describe('organization profile page', () => {
  it('shows the collectives backed by the organization', () => {
    cy.visit('/pubnub/legacy');
    cy.get('#backer');
    cy.get('.CollectiveCard').first().find('.totalDonations').contains('$1,700');
  });
});
