const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";
const random = Math.round(Math.random() * 100000);
const expenseDescription = `New expense ${random}`;

const init = (skip_signin = false) => {
  if (skip_signin) {
    cy.visit(`http://localhost:3000/signin/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImxvZ2luIiwiaWQiOjk0NzQsImVtYWlsIjoidGVzdHVzZXIrYWRtaW5Ab3BlbmNvbGxlY3RpdmUuY29tIiwiaWF0IjoxNTE3OTM2Njg5LCJleHAiOjE1MTgwMjMwODksImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzA2MCIsInN1YiI6OTQ3NH0.uw7RGXELcv7pmr80VCApQbyra03SPvm49lHyq4kZA28?next=/testcollective/expenses/new`);
  } else {
    cy.visit(`${WEBSITE_URL}/signin?next=/testcollective/expenses/new`)
    cy.get('.email.inputField input').type('testuser+admin@opencollective.com');
    cy.wait(500)
    cy.get('.LoginForm button').click();
  }
}

const uploadReceipt = (dropzoneElement = '.InputTypeDropzone') => {
  const dropEvent = {
    dataTransfer: {
        files: [],
    },
  };
  
  cy.fixture('./images/receipt.jpg').then((picture) => {
      return Cypress.Blob.base64StringToBlob(picture, 'image/jpeg').then((blob) => {
          dropEvent.dataTransfer.files.push(blob);
      });
  });
  
  cy.get(dropzoneElement).trigger('drop', dropEvent);    
  cy.wait(900);
}

describe("new expense", () => {
  it ("requires to login to submit an expense", () => {
    cy.visit(`${WEBSITE_URL}/testcollective/expenses/new`)
    cy.get('.CreateExpenseForm').contains("Sign up or login to submit an expense");
    cy.get('.inputField.email input').type("testuser+admin@opencollective.com");
    cy.get('.login').click();
    cy.wait(500);
    cy.get('.inputField.description');
  });

  it ("submits new expense paypal", () => {
    init();
    cy.get('.descriptionField input').type(expenseDescription);
    cy.get('.error').should('have.text', 'Amount must be greater than 0');
    cy.get('.amountField input').type(12);
    cy.get('.categoryField select').select('Team');
    cy.get('.error').should('have.text', 'Missing attachment');
    uploadReceipt();
    cy.get('.inputField.paypalEmail input').type('{selectall}{del}');
    cy.get('.error').should('have.text', 'Please provide your PayPal email address (or change the payout method)');
    cy.get('.inputField.paypalEmail input').type('paypal@test.com');
    cy.get('.inputField.privateMessage textarea').type("Some private note for the host");
    cy.get('button[type=submit]').click();
    cy.screenshot("expenseCreatedPaypalLoggedOut");
    cy.get('.expenseCreated').contains('success');
    cy.get('.actions .viewAllExpenses').click();
    cy.wait(500);
    cy.get('.itemsList .expense', { timeout: 10000 })
    cy.get('.Expenses .expense:first .description').contains(expenseDescription)
    cy.get('.Expenses .expense:first .status').contains("pending")
    cy.get('.Expenses .expense:first .meta').contains("Team")
    cy.get('.desktopOnly .submitExpense').click();
    cy.get('.descriptionField input').should('have.value', '');
    cy.get('.amountField input').should('have.value', '');
  })

  it ("submits a new expense other, edit it and approve it", () => {
    init();
    cy.get('.descriptionField input').type(expenseDescription);
    cy.wait(300)
    cy.get('.amountField input').type(12);
    cy.get('.payoutMethod.inputField select').select('other');
    uploadReceipt();
    cy.get('.LoginTopBarProfileButton').contains("testuseradmin", { timeout: 15000 })
    cy.get('.inputField.privateMessage textarea').type("Some private note for the host");
    cy.get('button[type=submit]').click();
    cy.screenshot("expenseCreatedLoggedIn");
    cy.get('.expenseCreated').contains('success');
    cy.get('.actions .viewAllExpenses').click();
    cy.wait(300);
    cy.get('.itemsList .expense', { timeout: 10000 })
    cy.get('.Expenses .expense:first .description').contains(expenseDescription);
    cy.get('.Expenses .expense:first .status').contains("pending")
    cy.get('.Expenses .expense:first .privateMessage').contains("Some private note for the host");
    cy.get('.Expenses .expense:first .ApproveExpenseBtn button').click();
    cy.get('.Expenses .expense:first .status').contains("approved")
    cy.screenshot("expenseApproved");
    cy.get('.Expenses .expense:first .toggleEditExpense').click();
    cy.get('.Expenses .expense:first .inputField.description input').type(" edited")
    cy.get('.Expenses .expense:first .inputField.amount input').type("13")
    cy.get('.Expenses .expense:first .inputField.category select').select("Team")
    cy.get('.Expenses .expense:first .inputField.privateMessage textarea').type('{selectall}Another private note (edited)')
    cy.get('.Expenses .expense:first .inputField.description input').focus();
    cy.wait(300)
    cy.screenshot("editExpense");
    cy.get('.Expenses .expense:first button.save').click();
    cy.get('.Expenses .expense:first .status').contains("pending") // editing an expense should switch status back to pending
    cy.get('.Expenses .expense:first .description').contains("edited");
    cy.get('.Expenses .expense:first .privateMessage').contains("edited");
    cy.get('.Expenses .expense:first .amount').contains("$13.00");
    cy.screenshot("expenseSaved");
    cy.get('.Expenses .expense:first .ApproveExpenseBtn button').click();
    cy.wait(300);
    cy.get('.Expenses .expense:first .status').contains("approved")    
  })

})