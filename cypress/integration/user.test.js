const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

describe("user profile page", () => {

  it ("shows the collectives backed by the user", () => {
    cy.visit(`${WEBSITE_URL}/xdamman`)
    cy.get("#BACKER");
    cy.get('#ADMIN .CollectiveCard').should('have.length', 2);
    cy.get('#BACKER .CollectiveCard').should('have.length', 3);
    cy.get('#BACKER .CollectiveCard').first().find('.totalDonations').contains('€5,140')
    cy.get('#ATTENDEE .CollectiveCard').should('have.length', 2);
  })

})