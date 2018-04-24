const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

describe("expenses.page.test.js", () => {
  it ("shows the /expenses page", () => {
    cy.visit(`${WEBSITE_URL}/railsgirlsatl/expenses`);
    cy.get('.Expenses .expense').should('have.length', 20);
    cy.get('.ExpensesStats .categories li:nth-child(3) a').click();
    cy.get('.Expenses .expense').should('have.length', 5);
  });
})
