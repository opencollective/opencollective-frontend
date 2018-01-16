const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
}

describe("collective.createOrder page", () => {

  before(() => {
    cy.visit(`${WEBSITE_URL}/apex/donate`)
  });

  it ("shows the bitcoin payment method type", () => {
    cy.get('.paymentMethodTypeSelector select option').should('have.length', 2);
    cy.get('.paymentMethodTypeSelector select').select('bitcoin');
    cy.get('.paymentDetails .error').contains("We can't generate a bitcoin address without a valid email address.");
    fill('email', 'test@test.com');
    cy.get('.btcAddress').contains("to this BTC address");
    cy.get('.intervalBtn.month').click();
    cy.get('.paymentMethodTypeSelector select option').should('have.length', 1);

  });

})