import 'cypress-file-upload';
const random = Math.round(Math.random() * 100000);
const expenseDescription = `New expense ${random}`;

const uploadReceipt = (dropzoneElement = '.InputTypeDropzone input') => {
  cy.fixture('./images/receipt.jpg').then(picture => {
    cy.get(dropzoneElement).upload({ fileContent: picture, fileName: 'receipt.jpg', mimeType: 'image/jpeg' });
  });
  cy.wait(900);
};

describe('New expense flow', () => {
  it('is disabled by default', () => {
    cy.visit(`testCollective/expenses/new-v2`);
    cy.contains('main', 'This feature is not activated for this collective');
  });

  describe('new expense when logged out', () => {
    it('shows the login screen', () => {
      cy.createHostedCollective({ settings: { features: { newExpenseFlow: true } } }).then(collective => {
        cy.visit(`/${collective.slug}/expenses/new-v2`);
        cy.getByDataCy('signIn-form');
      });
    });
  });

  describe('new expense when logged in', () => {
    let user, collective;

    before(() => {
      cy.createHostedCollective({ settings: { features: { newExpenseFlow: true } } }).then(c => {
        collective = c;
        cy.signup({
          user: { name: 'Potatoes Lover' },
          redirect: `/${collective.slug}/expenses/new-v2`,
        }).then(u => (user = u));
      });
    });

    beforeEach(() => {
      cy.login({ email: user.email, redirect: `/${collective.slug}/expenses/new-v2` });
    });

    it('submits new expense ', () => {
      cy.getByDataCy('radio-expense-type-RECEIPT').click();
      cy.get('input[name="description"]').type('Brussels January team retreat');

      // Upload 2 files to the multi-files dropzone
      cy.fixture('images/receipt.jpg').then(fileContent => {
        const getFile = idx => ({ fileContent, fileName: `receipt${idx}.jpg`, mimeType: 'image/jpeg' });
        const files = [getFile(1), getFile(2)];
        cy.getByDataCy('expense-multi-attachments-dropzone').upload(files, { subjectType: 'drag-n-drop' });
      });
      cy.getByDataCy('expense-attachment-form').should('have.length', 2);
      cy.getByDataCy('expense-summary-btn').should('be.disabled');

      // Fill info for first attachment
      cy.get('input[name="attachments[0].description"]').type('Fancy restaurant');
      cy.get('input[name="attachments[0].amount"]').type('{selectall}183');
      cy.getByDataCy('expense-summary-btn').should('be.disabled');
      cy.get('input:invalid').should('have.length', 2); // Missing attachment desctiption+amount
      cy.getByDataCy('attachments-total-amount').should('contain', '$183.00 USD');

      // Select Payout Method
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New PayPal account').click();

      // Try to submit with missing data
      cy.get('input:invalid').should('have.length', 3); // Previous incomplete fields + payout method email
      cy.getByDataCy('expense-summary-btn').click(); // Sould not submit

      // Fill missing info & submit
      cy.get('input[name="payoutMethod.data.email"]').type('paypal-test@opencollective.com');
      cy.get('input[name="attachments[1].description"]').type('Potatoes for the giant raclette');
      cy.get('input[name="attachments[1].amount"]').type('{selectall}92.50');
      cy.getByDataCy('attachments-total-amount').should('contain', '$275.50 USD');
      cy.get('input:invalid').should('have.length', 0);
      cy.getByDataCy('expense-summary-btn').click();

      // Check summary
      cy.getByDataCy('expense-summary-payee').should('contain', 'Potatoes Lover');
      cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
      cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'paypal-test@opencollective.com');
      cy.getByDataCy('expense-summary-payout-method-type').should('contain', 'PayPal');
      cy.getByDataCy('attachments-total-amount').should('contain', '$275.50 USD');
      cy.getByDataCy('expense-summary-attachments').should('contain', 'Fancy restaurant');
      cy.getByDataCy('expense-summary-attachments').should('contain', 'Potatoes for the giant raclette');

      cy.getByDataCy('submit-expense-btn').click();
      cy.contains('[data-cy="expense-pending"]', 'Brussels January team retreat');
    });

    // This can happen if you start with an invoice then switch to receipts
    it('should prevent submitting receipts if missing attachments', () => {
      // Fill the form with valid data
      cy.getByDataCy('radio-expense-type-INVOICE').click();
      cy.get('input[name="description"]').type('March invoice');
      cy.get('input[name="attachments[0].description"]').type('Peeling potatoes');
      cy.get('input[name="attachments[0].amount"]').type('{selectall}4200');
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New PayPal account').click();
      cy.get('input[name="payoutMethod.data.email"]').type('paypal-test@opencollective.com');

      // Switch to receipt and acnkowledge error
      cy.getByDataCy('radio-expense-type-RECEIPT').click();
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('attachment-url-field').should('contain', 'This field is required');
    });
  });
});

describe('Legacy expense flow', () => {
  describe('new expense when logged out', () => {
    it('requires to login to submit an expense', () => {
      cy.visit('/testcollective/expenses');
      cy.containsInDataCy('submit-expense-btn', 'Submit Expense').click();
      cy.get('.CreateExpenseForm').contains('Sign up or login to submit an expense');
      cy.get('#email').type('testuser+admin@opencollective.com');
      cy.get('[data-cy="signin-btn"]').click();
      cy.wait(2000);
      cy.get('.inputField.description', { timeout: 5000 });
    });
  });

  describe('new expense when logged in', () => {
    beforeEach(() => {
      cy.login({ redirect: '/testcollective/expenses/new' });
    });

    it('submits new expense paypal', () => {
      cy.get('.descriptionField input').type(expenseDescription);
      cy.get('.error').should('have.text', 'Amount must be greater than 0');
      cy.get('.amountField input').type(12);
      cy.get('.categoryField select').select('Team');
      cy.get('.error').should('have.text', 'Missing attachment');
      uploadReceipt();
      cy.get('.error').should('have.text', 'Please pick the type of this expense');
      cy.get('.expenseField select').select('RECEIPT');
      cy.get('.inputField.paypalEmail input').type('{selectall}{del}');
      cy.get('.error').should('have.text', 'Please provide your PayPal email address (or change the payout method)');
      cy.get('.inputField.paypalEmail input').type('paypal@test.com');
      cy.get('.inputField.privateMessage textarea').type('Some private note for the host');
      cy.get('button[type=submit]').click();
      cy.get('[data-cy="expenseCreated"]').contains('success');
      cy.get('[data-cy="viewAllExpenses"]').click();
      cy.wait(300);
      cy.get('.itemsList .expense', { timeout: 10000 });
      cy.get('.Expenses .expense:first .description').contains(expenseDescription);
      cy.get('.Expenses .expense:first .status').contains('pending');
      cy.get('.Expenses .expense:first .meta').contains('Team');
    });

    it('submits a new expense other, edit it and approve it', () => {
      cy.get('.descriptionField input').type(expenseDescription);
      cy.wait(300);
      cy.get('.amountField input', { timeout: 5000 }).type(12);
      cy.get('.payoutMethod.inputField select').select('other');
      uploadReceipt();
      cy.get('.expenseField select').select('RECEIPT');
      cy.wait(300);
      cy.get('.LoginTopBarProfileButton').contains('testuseradmin', {
        timeout: 15000,
      });
      cy.get('.inputField.privateMessage textarea').type('Some private note for the host');
      cy.get('button[type=submit]').click();
      cy.get('[data-cy="expenseCreated"]').contains('success');
      cy.get('[data-cy="viewAllExpenses"]').click();
      cy.wait(300);
      cy.get('.itemsList .expense', { timeout: 10000 });
      cy.get('.Expenses .expense:first .description').contains(expenseDescription);
      cy.get('.Expenses .expense:first .status').contains('pending');
      cy.get('.Expenses .expense:first .privateMessage').contains('Some private note for the host');
      cy.get('.Expenses .expense:first .ApproveExpenseBtn button').click();
      cy.get('.Expenses .expense:first .status').contains('approved');
      cy.get('.Expenses .expense:first .toggleEditExpense').click();
      cy.get('.Expenses .expense:first .inputField.description input').type(' edited');
      cy.get('.Expenses .expense:first .inputField.amount input').type('{selectall}13');
      cy.get('.Expenses .expense:first .inputField.category select').select('Team');
      cy.get('.Expenses .expense:first .inputField.privateMessage textarea').type(
        '{selectall}Another private note (edited)',
      );
      cy.get('.Expenses .expense:first .inputField.description input').focus();
      cy.wait(300);
      cy.get('.Expenses .expense:first button.save').click();
      cy.get('.Expenses .expense:first .status').contains('pending'); // editing an expense should switch status back to pending
      cy.get('.Expenses .expense:first .description').contains('edited');
      cy.get('.Expenses .expense:first .privateMessage').contains('edited');
      cy.get('.Expenses .expense:first .amount').contains('$13.00');
      cy.get('.Expenses .expense:first .ApproveExpenseBtn button').click();
      cy.wait(300);
      cy.get('.Expenses .expense:first .status', { timeout: 5000 }).contains('approved');
    });
  });
});
