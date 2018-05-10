const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
}

describe("event.createOrder page", () => {

  it ("makes an order as new user", () => {
    cy.visit(`${WEBSITE_URL}/opensource/events/webpack-webinar`);
    cy.get('#free.tier .btn.increase').click();
    cy.get('#free.tier .ctabtn').click();
    cy.location().should((location) => {
      expect(location.pathname).to.eq(`/opensource/events/webpack-webinar/order/78`);
      expect(location.search).to.eq(`?quantity=2&totalAmount=0`);
    });
    cy.wait(500);
    cy.get('.order');
    fill("email", 'newuser@opencollective.com');
    fill("firstName", 'New');
    fill("lastName", 'User');
    fill("website", "http://mywebsite.com");
    fill("twitterHandle", "twhandle")
    cy.get('.inputField.publicMessage textarea').type("excited to meet the community!");
    cy.wait(400)
    cy.get('.actions .submit button').click();
    cy.wait(400)
    cy.get('.UserCollectivePage', { timeout: 10000 });
    cy.get('.OrderCreated').contains("Thank you for your RSVP! See you soon!");
    cy.get('.OrderCreated').contains("/opensource/events/webpack-webinar");
    cy.location().should((location) => {
      expect(location.search).to.eq(`?status=orderCreated&CollectiveId=8735&TierId=78&type=EVENT&totalAmount=0`);
    });
  });
})
