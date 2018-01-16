const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
}

describe("collective.createOrder page", () => {

  it ("loads custom donate page", () => {
    cy.visit(`${WEBSITE_URL}/apex/donate/50/month/custom%20description`)
    cy.get('.tier .description').contains("custom description");
    cy.get('.tier .amount').contains("$50/monthly");
  });

  it ("shows the bitcoin payment method type", () => {
    cy.visit(`${WEBSITE_URL}/apex/donate`)
    cy.get('.paymentMethodTypeSelector select option').should('have.length', 2);
    cy.get('.paymentMethodTypeSelector select').select('bitcoin');
    cy.get('.paymentDetails .error').contains("We can't generate a bitcoin address without a valid email address.");
    fill('email', 'test@test.com');
    cy.get('.btcAddress').contains("to this BTC address");
    cy.get('.intervalBtn.month').click();
    cy.get('.paymentMethodTypeSelector select option').should('have.length', 1);
  });

})