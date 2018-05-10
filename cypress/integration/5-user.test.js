const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

describe("user profile page", () => {

  it ("shows the collectives backed by the user", () => {
    cy.visit(`${WEBSITE_URL}/xdamman`)
    cy.get("#backer");
    cy.get('#admin.organization .subtitle').contains("I'm an administrator of these 2 organizations");
    cy.get('#admin.organization .CollectiveCard').should('have.length', 2);
    cy.get('#admin.collective .subtitle').contains("I'm a core contributor of these 2 collectives");
    cy.get('#admin.collective .CollectiveCard').should('have.length', 2);
    cy.get('#backer .CollectiveCard').should('have.length', 3);
    cy.get('#backer .CollectiveCard').first().find('.totalDonations').contains('€5,140')
    cy.get('#attendee .CollectiveCard').should('have.length', 2);
  })

})
