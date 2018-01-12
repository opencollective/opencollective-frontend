const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

describe("organization profile page", () => {

  it ("shows the collectives backed by the organization", () => {
    cy.visit(`${WEBSITE_URL}/pubnub`)
    cy.get("#BACKER");
    cy.get('.CollectiveCard').first().find('.totalDonations').contains('$1,700')
  })

})