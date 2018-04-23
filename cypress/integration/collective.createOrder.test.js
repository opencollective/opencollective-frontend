const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
}

describe("collective.createOrder page", () => {

  it ("loads custom donate page", () => {
    cy.visit(`${WEBSITE_URL}/apex/donate/50/month/custom%20description`)
    cy.get('.tier .description').contains("custom description");
    cy.get('.tier .amount').contains("$50");
    cy.get('.tier .amount').contains("per month");
  });

  it ("makes an order as a new organization", () => {
    cy.visit(`${WEBSITE_URL}/apex/donate`);
    cy.get('.inputField.email input').type('testuser@opencollective.com');
    cy.wait(400)
    cy.get('.actions .submit button').click();
    cy.get('.result .error').contains("Credit card missing");
    cy.get('.fromCollectiveSelector select').select('organization');
    cy.wait(400)
    cy.get('.actions .submit button').click();
    cy.get('.result .error').contains("Please provide a name for the new organization");
    cy.get('.organizationDetailsForm .organization_name input').type('new org');
    cy.wait(400)
    cy.get('.actions .submit button').click();
    cy.get('.result .error').contains("Please provide a website for the new organization");
    cy.get('.organizationDetailsForm .organization_website input').type('neworg.com');
    cy.wait(400)
    cy.get('.actions .submit button').click();
    cy.get('.result .error').contains("Credit card missing");
  });

})
