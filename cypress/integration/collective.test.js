const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

describe("collective page", () => {

  before(() => {
    cy.visit(`${WEBSITE_URL}/apex`)
  });

  it ("loads the collective page", () => {
    cy.get('#contribute .TierCard').should('have.length', 2);
    cy.get('#organizations h1').contains("1 organization is supporting APEX");
    cy.get("#organizations .CollectiveCard").first().find('.totalDonations').contains("$1,700");
    cy.get("#backers h1").contains("25 people are supporting APEX");
    cy.get("#backers .Member").should('have.length', 25);
  });

  it ("loads the latest expenses", () => {
    cy.get("#expenses .filter .pending").click();
    cy.get("#expenses .itemsList .empty").contains("No expenses");
    cy.get("#expenses .filter .paid").click();
    cy.get("#expenses .itemsList .expense").should("have.length", 5);
  });

  it ("opens all expenses page", () => {
    cy.get("#expenses .ViewAllExpensesBtn").click();
    cy.get(".ExpensesPage .CollectiveCover h1").contains("Expenses");
    cy.get(".ExpensesPage .itemsList .expense").should("have.length", 6);
    cy.get(".ExpensesPage .CollectiveCover .goBack").click();
  });
  
  it ("opens new expense page", () => {
    cy.get("#expenses .SubmitExpenseBtn").click();
    cy.wait(500);
    cy.get(".ExpensesPage .CollectiveCover h1").contains("Expenses");
    cy.get(".ExpensesPage .inputField.descriptionField")
    cy.get(".ExpensesPage .CollectiveCover .goBack").click();
  });
  
  it ("loads the latest transactions", () => {
    cy.get("#transactions .filter .credit").click();
    cy.get("#transactions .itemsList .transaction").should("have.length", 5);
    cy.get("#transactions .itemsList .transaction:first .amount").contains("$2");
    cy.get("#transactions .filter .debit").click();
    cy.wait(500);
    cy.get("#transactions .itemsList .transaction").should("have.length", 5);
    cy.get("#transactions .itemsList .transaction:first .amount").contains("-$561.00");
  });
  
  it ("opens all transactions page", () => {
    cy.get("#transactions .ViewAllTransactionsBtn").click();
    cy.wait(500);
    cy.get(".TransactionsPage .CollectiveCover h1").contains("Latest transactions");
    cy.get(".TransactionsPage .itemsList .transaction").should("have.length", 20);
    cy.get(".TransactionsPage .loadMoreBtn");
    cy.get(".TransactionsPage .CollectiveCover .goBack").click();
  });
})