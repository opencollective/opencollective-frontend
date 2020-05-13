import 'cypress-file-upload';

const random = Math.round(Math.random() * 100000);
const expenseDescription = `New expense ${random}`;
import { randomSlug } from '../support/faker';

const uploadReceipt = (dropzoneElement = '.InputTypeDropzone input') => {
  cy.fixture('./images/receipt.jpg').then(picture => {
    cy.get(dropzoneElement).upload({ fileContent: picture, fileName: 'receipt.jpg', mimeType: 'image/jpeg' });
  });
  cy.wait(900);
};

describe('New expense flow', () => {
  describe('new expense when logged out', () => {
    it('shows the login screen', () => {
      cy.createHostedCollective().then(collective => {
        cy.visit(`/${collective.slug}/expenses/new`);
        cy.getByDataCy('signIn-form');
      });
    });
  });

  describe('new expense when logged in', () => {
    let user, collective;

    before(() => {
      cy.createHostedCollective().then(c => {
        collective = c;
        cy.signup({
          user: { name: 'Potatoes Lover' },
          redirect: `/${collective.slug}/expenses/new`,
        }).then(u => (user = u));
      });
    });

    beforeEach(() => {
      cy.login({ email: user.email, redirect: `/${collective.slug}/expenses/new` });
    });

    it('has a dismissible help message', () => {
      cy.getByDataCy('expense-create-help').should('exist');
      cy.getByDataCy('dismiss-expense-create-help').click();
      cy.getByDataCy('expense-create-help').should('not.exist');
      cy.wait(250); // Give some time for the GQL request
      cy.reload();
      cy.waitForLoggedIn();
      cy.wait(200); // Give some time to make sure frontend can fully refresh after logged in
      cy.getByDataCy('expense-create-help').should('not.exist');
    });

    it('submits new expense then edit it', () => {
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
      cy.get('input[name="items[0].description"]').type('Fancy restaurant');
      cy.get('input[name="items[0].amount"]').type('{selectall}183');
      cy.getByDataCy('expense-summary-btn').should('be.disabled');
      cy.get('input:invalid').should('have.length', 2); // Missing attachment desctiption+amount
      cy.getByDataCy('expense-items-total-amount').should('contain', '--.--'); // amount for second item is missing

      // Select Payout Method
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New PayPal account').click();

      // Try to submit with missing data
      cy.get('input:invalid').should('have.length', 3); // Previous incomplete fields + payout method email
      cy.getByDataCy('expense-summary-btn').click(); // Should not submit

      // Fill missing info & submit
      cy.get('input[name="payoutMethod.data.email"]').type('paypal-test@opencollective.com');
      cy.get('input[name="items[1].description"]').type('Potatoes for the giant raclette');
      cy.get('input[name="items[1].amount"]').type('{selectall}92.50');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$275.50 USD');
      cy.get('input:invalid').should('have.length', 0);
      cy.getByDataCy('expense-summary-btn').click();

      // Check summary
      cy.getByDataCy('expense-summary-payee').should('contain', 'Potatoes Lover');
      cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
      cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'paypal-test@opencollective.com');
      cy.getByDataCy('expense-summary-payout-method-type').should('contain', 'PayPal');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$275.50 USD');
      cy.getByDataCy('expense-summary-items').should('contain', 'Fancy restaurant');
      cy.getByDataCy('expense-summary-items').should('contain', 'Potatoes for the giant raclette');

      // Submit!
      cy.getByDataCy('submit-expense-btn').click();
      cy.contains('[data-cy="temporary-notification"]', 'Expense submited!');
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat');
      cy.getByDataCy('dismiss-temporary-notification-btn').click();
      cy.getByDataCy('temporary-notification').should('not.exist');

      // Start editing
      cy.getByDataCy('edit-expense-btn').click();
      cy.get('input[name="description"]').type(' edited');
      cy.get('input[name="items[0].description"]').type(' but not too expensive');
      cy.get('input[name="items[0].amount"]').type('{selectall}111');
      // Add new item
      cy.getByDataCy('expense-add-item-btn').click();
      cy.get('input[name="items[2].description"]').type('Some more delicious stuff');
      cy.get('input[name="items[2].amount"]').type('{selectall}34');
      cy.fixture('images/receipt.jpg').then(fileContent => {
        cy.getByDataCy('items[2].url-dropzone').upload(
          [{ fileContent, fileName: `receipt2.jpg`, mimeType: 'image/jpeg' }],
          { subjectType: 'drag-n-drop' },
        );
      });
      // Change payee - use a new organization
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New PayPal account').click();
      cy.get('input[name="payoutMethod.data.email"]').type('paypal-test-2@opencollective.com');
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('save-expense-btn').click();
      cy.getByDataCy('save-expense-btn').should('not.exist'); // wait for form to be submitted

      // Check final expense page
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat edited');
      cy.getByDataCy('expense-summary-payee').should('contain', 'Potatoes Lover');
      cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
      cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'paypal-test-2@opencollective.com');
      cy.getByDataCy('expense-summary-payout-method-type').should('contain', 'PayPal');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$237.50 USD');
      cy.getByDataCy('expense-summary-items').should('contain', 'Fancy restaurant');
      cy.getByDataCy('expense-summary-items').should('contain', 'Potatoes for the giant raclette');
      cy.getByDataCy('expense-summary-items').should('contain', 'Some more delicious stuff');
    });

    // This can happen if you start with an invoice then switch to receipts
    it('should prevent submitting receipts if missing items', () => {
      // Fill the form with valid data
      cy.getByDataCy('radio-expense-type-INVOICE').click();
      cy.get('input[name="description"]').type('March invoice');
      cy.get('input[name="items[0].description"]').type('Peeling potatoes');
      cy.get('input[name="items[0].amount"]').type('{selectall}4200');
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New PayPal account').click();
      cy.get('input[name="payoutMethod.data.email"]').type('paypal-test@opencollective.com');

      // Switch to receipt and acnkowledge error
      cy.getByDataCy('radio-expense-type-RECEIPT').click();
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('attachment-url-field').should('contain', 'Receipt required');
    });
  });

  describe('Actions on expense', () => {
    let collectiveSlug;

    before(() => {
      cy.login({ redirect: '/brusselstogetherasbl' });
      cy.get('[data-cy="host-apply-btn"]:visible').click();
      collectiveSlug = randomSlug();
      cy.get(`input[name="name"]`).type('new-collective');
      cy.get(`input[name="slug"]`).type(collectiveSlug);
      cy.get(`input[name="description"]`).type('short description for new collective');
      // FIXME: more precise selector such as
      // cy.get('input[name="tos"] [data-cy="custom-checkbox"]').click();
      cy.get('[data-cy="custom-checkbox"]').click();
      cy.wait(300);
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
      cy.visit(`/new-collective${collectiveSlug}/expenses/new/v2`);
      cy.wait(200);
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
      cy.get('input[name="items[0].description"]').type('Fancy restaurant');
      cy.get('input[name="items[0].amount"]').type('{selectall}13');
      cy.getByDataCy('expense-summary-btn').should('be.disabled');
      cy.get('input:invalid').should('have.length', 2); // Missing attachment desctiption+amount
      cy.getByDataCy('expense-items-total-amount').should('contain', '--.--'); // amount for second item is missing

      // Select Payout Method
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
      cy.get('[data-cy="payout-other-info"]').type('A simple thanks would work');
      // cy.get('input[name="privateMessage"]').type('A simple thanks would work');
      cy.get('input[name="items[1].description"]').type('Potatoes for the giant raclette');
      cy.get('input[name="items[1].amount"]').type('{selectall}2.50');
      cy.getByDataCy('expense-summary-btn').click();

      // Submit!
      cy.getByDataCy('submit-expense-btn').click();
      cy.contains('[data-cy="temporary-notification"]', 'Expense submited!');
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat');
      cy.getByDataCy('dismiss-temporary-notification-btn').click();
      cy.getByDataCy('temporary-notification').should('not.exist');

      // Donate some money
      cy.visit(`/new-collective${collectiveSlug}/donate`);
      cy.contains('#contributeAs > label', 'A new organization').click();

      // Name must be shown on step
      cy.get('#contributeAs input[name=name]').type('Evil Corp');
      cy.get('.step-contributeAs').contains('Evil Corp');

      // Fill form
      cy.get('#contributeAs input[name=website]').type('https://www.youtube.com/watch?v=oHg5SJYRHA0');
      cy.get('#contributeAs input[name=githubHandle]').type('test');
      cy.get('#contributeAs input[name=twitterHandle]').type('test');

      // Submit form
      cy.contains('button:not([disabled])', 'Next step').click();
      cy.get('input[type=number][name=custom-amount]').type('{selectall}1337');

      cy.contains('button:not([disabled])', 'Next step').click();
      cy.wait(5000);
      cy.fillStripeInput();
      cy.contains('button', 'Make contribution').click();
      cy.wait(5000);
    });

    it('Approve, unapprove, reject and pay actions on expense', () => {
      cy.visit(`/new-collective${collectiveSlug}/expenses/v2`);
      cy.wait(100);
      cy.get('[data-cy="single-expense"]:nth-child(1) [data-cy="expense-link"]').click({ force: true });
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat');
      cy.get('[data-cy="expense-status-msg"]').contains('pending');
      cy.getByDataCy('approve-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('approved');
      cy.getByDataCy('unapprove-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('pending');
      cy.getByDataCy('approve-button').click();
      cy.getByDataCy('pay-button').click();
      cy.getByDataCy('mark-as-paid-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('paid');
      cy.get('[data-cy="collective-balance"] > span').contains('€1,216');
      cy.wait(200);
      cy.getByDataCy('mark-as-unpaid-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('approved');
      cy.getByDataCy('unapprove-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('pending');
      cy.getByDataCy('reject-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('rejected');
      cy.get('[data-cy="collective-balance"] > span').contains('€1,231');

      // Now delete the expense
      // cy.getByDataCy('delete-expense-button').click();
      // cy.getByDataCy('confirmation-modal-continue').click();
      // cy.wait(200);
      // cy.visit(`/new-collective${collectiveSlug}/expenses/v2`);
      // cy.wait(100);
      // cy.get('[data-cy="zero-expense-message"]').contains('No expenses');
    });

    it('Delete actions on expense', () => {
      cy.login({ email: 'testuser+admin@opencollective.com' });
      cy.wait(300);
      cy.visit(`/new-collective${collectiveSlug}/expenses/v2`);
      cy.wait(300);
      cy.get('[data-cy="single-expense"]:nth-child(1) [data-cy="expense-link"]').click({ force: true });
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat');
      cy.get('[data-cy="expense-status-msg"]').contains('rejected');
      cy.get('[data-cy="collective-balance"] > span').contains('€1,231');

      // Now delete the expense
      cy.getByDataCy('delete-expense-button').click();
      cy.getByDataCy('confirmation-modal-continue').click();
      cy.wait(200);
      cy.visit(`/new-collective${collectiveSlug}/expenses/v2`);
      cy.wait(100);
      cy.get('[data-cy="zero-expense-message"]').contains('No expenses');
    });
  });
});

describe('Legacy expense flow', () => {
  describe('new expense when logged out', () => {
    it('requires to login to submit an expense', () => {
      cy.visit('/testcollective/expenses/new/legacy');
      cy.get('.CreateExpenseForm').contains('Sign up or login to submit an expense');
      cy.get('#email').type('testuser+admin@opencollective.com');
      cy.get('[data-cy="signin-btn"]').click();
      cy.wait(2000);
      cy.get('.inputField.description', { timeout: 5000 });
    });
  });

  describe('new expense when logged in', () => {
    beforeEach(() => {
      cy.login({ redirect: '/testcollective/expenses/new/legacy' });
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
      cy.getByDataCy('expense-edit-save-btn').click();
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
