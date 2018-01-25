const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

describe("widgets", () => {

  it ("shows the collectives hosted by the host", () => {
    cy.visit(`${WEBSITE_URL}/brusselstogether/collectives.html?role=host`)
    cy.get('.CollectiveCard').its('length').should('be.gt', 1)
  })

  it ("shows the collectives backed by a user", () => {
    cy.visit(`${WEBSITE_URL}/xdamman/widget.html`);
    cy.get('.CollectiveCard').should('have.length', 16);
  })

  it ("shows the latest events", () => {
    cy.visit(`${WEBSITE_URL}/veganizerbxl/events.html`);
    cy.get('.pastEvents li').should('have.length', 6);
  })
  
  it ("populates the iframes", () => {
    cy.visit(`${WEBSITE_URL}/static/widgets.test.html`);
    cy.get('.widgetContainer.widget iframe');
    cy.get('.widgetContainer.banner iframe');
    cy.get('.widgetContainer.events iframe');
    cy.get('.widgetContainer.collectives iframe');
  })
})