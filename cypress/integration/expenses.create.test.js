const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";
const random = Math.round(Math.random() * 100000);
const expenseDescription = `New expense ${random}`;


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
  it ("submits new expense as logged out user", () => {
    cy.visit(`${WEBSITE_URL}/testcollective/expenses/new`)
    cy.get('.descriptionField input').type(expenseDescription);
    cy.get('.error').should('have.text', 'Amount must be greater than 0');
    cy.get('.amountField input').type(12);
    cy.get('.categoryField select').select('Team');
    cy.get('.error').should('have.text', 'Missing attachment');
    uploadReceipt();
    cy.get('.error').should('have.text', 'Please provide your PayPal email address (or change the payout method)');
    cy.get('.inputField.paypalEmail input').type('paypal@test.com');
    cy.get('.inputField.privateMessage textarea').type("Some private note for the host");
    cy.get('.inputField.email input').should('have.value', 'paypal@test.com');
    cy.get('.inputField.email input').type('{selectall}{backspace}');
    cy.get('.error').should('have.text', 'Please provide your email address');
    cy.get('.inputField.email input').type('user@test.com');
    cy.get('button[type=submit]').click();
    cy.screenshot("expenseCreatedPaypalLoggedOut");
    cy.get('.expenseCreated').contains('success');
    cy.get('.Expenses .expense:first .description').contains(expenseDescription)
    cy.get('.Expenses .expense:first .status').contains("pending")
    cy.get('.Expenses .expense:first .meta').contains("Team")
    cy.get('.submitNewExpense').click();
    cy.get('.descriptionField input').should('have.value', '');
    cy.get('.amountField input').should('have.value', '');
  })

  it ("submits a new expense payout method: other", () => {
    cy.visit(`${WEBSITE_URL}/testcollective/expenses/new`)
    cy.get('.descriptionField input').type(expenseDescription);
    cy.get('.error').should('have.text', 'Amount must be greater than 0');
    cy.get('.amountField input').type(12);
    cy.get('.payoutMethod.inputField select').select('other');
    uploadReceipt();
    cy.get('.error').should('have.text', `Please provide instructions on how you'd like to be reimbursed as a private note`);
    cy.get('.inputField.privateMessage textarea').type("Some private note for the host");
    cy.get('.inputField.email input').type('user@test.com');
    cy.get('button[type=submit]').click();
    cy.screenshot("expenseCreatedOtherLoggedOut");
    cy.get('.expenseCreated').contains('success');
    cy.get('.Expenses .expense:first .description').contains(expenseDescription);    
    cy.get('.Expenses .expense:first .status').contains("pending")
    cy.get('.Expenses .expense:first .meta').contains("Communications")
  })

  it ("submits a new expense logged in", () => {
    cy.visit(`${WEBSITE_URL}/signin?next=/testcollective/expenses/new`)
    cy.get('.email.inputField input').type('testuser+admin@opencollective.com');
    cy.wait(500)
    cy.get('.email.inputField input').type('{enter}');
    cy.get('.descriptionField input').type(expenseDescription);
    cy.wait(500)
    cy.get('.amountField input').type(12);
    cy.get('.payoutMethod.inputField select').select('other');
    uploadReceipt();
    cy.get('.LoginTopBarProfileButton').contains("testuseradmin", { timeout: 15000 })
    cy.get('.inputField.privateMessage textarea').type("Some private note for the host");
    cy.get('button[type=submit]').click();
    cy.screenshot("expenseCreatedLoggedIn");
    cy.get('.expenseCreated').contains('success');
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
    cy.get('.Expenses .expense:first .status').contains("approved")    
  })

})