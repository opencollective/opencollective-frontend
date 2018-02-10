const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

describe("collective page", () => {

  before(() => {
    cy.visit(`${WEBSITE_URL}/apex`)
  });

  it ("loads the collective page", () => {
    cy.get('#contribute .TierCard').should('have.length', 2);
    cy.get("#contributors .CollectiveCard").first().find('.totalDonations').contains("$1,700");
    cy.get("#budget .subtitle").contains("Current balance: $4.71");
    cy.get(".Members.cardsList .Member").should('have.length', 26);
  });

  it ("loads the latest expenses", () => {
    cy.get("#expenses .itemsList .expense").should("have.length", 5);
  });

  it ("opens all expenses page", () => {
    cy.get("#expenses .ViewAllExpensesBtn").click();
    cy.get(".ExpensesPage .ExpensesStats").contains("Available balance");
    cy.get(".ExpensesPage .ExpensesStats").contains("Engineering ($3,808)");
    cy.get(".ExpensesPage .ExpensesStats").contains("TJ Holowaychuk ($3,391)");
    cy.get(".ExpensesPage .itemsList .expense").should("have.length", 6);
    cy.get(".ExpensesPage .desktopOnly .menu .item.budget").click();
  });
  
  it("opens new expense page", () => {
    cy.get(".desktopOnly button.submitExpense").click();
    cy.wait(500);
    cy.get(".ExpensesPage .CreateExpenseForm").contains("Sign up or login to submit an expense");
    cy.get(".ExpensesPage .desktopOnly .menu .item.budget").click();
  });
  
  it ("loads the latest transactions", () => {
    cy.get("#transactions .itemsList .transaction").should("have.length", 5);
    cy.get("#transactions .itemsList .transaction:first .amount").contains("$2");
  });
  
  it ("opens all transactions page", () => {
    cy.get("#transactions .ViewAllTransactionsBtn").click();
    cy.wait(500);
    cy.get(".TransactionsPage .itemsList .transaction").should("have.length", 20);
    cy.get(".TransactionsPage .loadMoreBtn");
    cy.get(".TransactionsPage .filterBtnGroup button").last().click();
    cy.get(".TransactionsPage .itemsList .transaction").should("have.length", 6);
    cy.get(".TransactionsPage .desktopOnly .menu .item.about").click();
  });
})