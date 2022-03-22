import 'cypress-file-upload';

import { randomEmail } from '../support/faker';

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
      // Select Payout Method
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New PayPal account').click();
      cy.get('input[name="payoutMethod.data.email"]').type('paypal-test@opencollective.com');
      cy.getByDataCy('expense-next').click();

      cy.get('input[name="description"]').type('Brussels January team retreat');

      cy.getByDataCy('expense-summary-btn').should('be.disabled');
      // Upload 2 files to the multi-files dropzone
      cy.fixture('images/receipt.jpg').then(fileContent => {
        const getFile = idx => ({ fileContent, fileName: `receipt${idx}.jpg`, mimeType: 'image/jpeg' });
        const files = [getFile(1), getFile(2)];
        cy.getByDataCy('expense-multi-attachments-dropzone').upload(files, { subjectType: 'drag-n-drop' });
      });
      cy.getByDataCy('expense-attachment-form').should('have.length', 2);

      // Fill info for first attachment
      cy.get('input[name="items[0].description"]').type('Fancy restaurant');
      cy.get('input[name="items[0].amount"]').type('{selectall}183');
      cy.get('input:invalid').should('have.length', 2); // Missing attachment desctiption+amount
      cy.getByDataCy('expense-items-total-amount').should('contain', '--.--'); // amount for second item is missing

      // Try to submit with missing data
      cy.get('input:invalid').should('have.length', 2); // Previous incomplete fields + payout method email
      cy.getByDataCy('expense-summary-btn').click(); // Should not submit

      // Fill missing info & submit
      cy.get('input[name="items[1].description"]').type('Potatoes for the giant raclette');
      cy.get('input[name="items[1].amount"]').type('{selectall}92.50');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$275.50');
      cy.get('input:invalid').should('have.length', 0);
      cy.getByDataCy('expense-summary-btn').click();

      // Check summary
      cy.getByDataCy('expense-summary-payee').should('contain', 'Potatoes Lover');
      cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
      cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'paypal-test@opencollective.com');
      cy.getByDataCy('expense-summary-payout-method-type').should('contain', 'PayPal');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$275.50');
      cy.getByDataCy('expense-summary-items').should('contain', 'Fancy restaurant');
      cy.getByDataCy('expense-summary-items').should('contain', 'Potatoes for the giant raclette');

      // Submit!
      cy.getByDataCy('submit-expense-btn').click();
      cy.contains('[data-cy="toast-notification"]', 'Expense submitted');
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat');
      cy.getByDataCy('dismiss-toast-btn').click();
      cy.getByDataCy('toast-notification').should('not.exist');

      // Start editing
      cy.getByDataCy('edit-expense-btn').click();
      cy.getByDataCy('expense-next').click();
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
      cy.getByDataCy('expense-back').click();
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New PayPal account').click();
      cy.get('input[name="payoutMethod.data.email"]').type('paypal-test-2@opencollective.com');
      cy.getByDataCy('expense-next').click();
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('save-expense-btn').click();
      cy.getByDataCy('save-expense-btn').should('not.exist'); // wait for form to be submitted

      // Check final expense page
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat edited');
      cy.getByDataCy('expense-summary-payee').should('contain', 'Potatoes Lover');
      cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
      cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'paypal-test-2@opencollective.com');
      cy.getByDataCy('expense-summary-payout-method-type').should('contain', 'PayPal');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$237.50');
      cy.getByDataCy('expense-summary-items').should('contain', 'Fancy restaurant');
      cy.getByDataCy('expense-summary-items').should('contain', 'Potatoes for the giant raclette');
      cy.getByDataCy('expense-summary-items').should('contain', 'Some more delicious stuff');
    });

    it('can create a new organization', () => {
      cy.getByDataCy('radio-expense-type-RECEIPT').click();

      cy.getByDataCy('select-expense-payee').click();
      cy.getByDataCy('collective-type-picker-ORGANIZATION').click();
      cy.getByDataCy('mini-form-name-field').type('Dummy Expense Org');
      cy.getByDataCy('mini-form-website-field').type('dummy.com');
      cy.getByDataCy('mini-form-save-button').click();
      cy.wait(250);

      // Select Payout Method
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
      cy.get('textarea[name="payoutMethod.data.content"]').type('make it rain');
      cy.getByDataCy('expense-next').click();

      cy.get('input[name="description"]').type('Brussels January team retreat');

      cy.fixture('images/receipt.jpg').then(fileContent => {
        const getFile = idx => ({ fileContent, fileName: `receipt${idx}.jpg`, mimeType: 'image/jpeg' });
        const files = [getFile(1), getFile(2)];
        cy.getByDataCy('expense-multi-attachments-dropzone').upload(files, { subjectType: 'drag-n-drop' });
      });
      cy.getByDataCy('expense-attachment-form').should('have.length', 2);
      // Fill info for first attachment
      cy.get('input[name="items[0].description"]').type('Fancy restaurant');
      cy.get('input[name="items[0].amount"]').type('{selectall}183');
      cy.get('input[name="items[1].description"]').type('Potatoes for the giant raclette');
      cy.get('input[name="items[1].amount"]').type('{selectall}92.50');
      cy.getByDataCy('expense-summary-btn').click();

      cy.getByDataCy('expense-summary-payee').should('contain', 'Dummy Expense Org');
      cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
      cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'make it rain');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$275.50');
      cy.getByDataCy('expense-summary-items').should('contain', 'Fancy restaurant');
      cy.getByDataCy('expense-summary-items').should('contain', 'Potatoes for the giant raclette');

      // Submit!
      cy.getByDataCy('submit-expense-btn').click();
      cy.contains('[data-cy="toast-notification"]', 'Expense submitted');
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat');
      cy.getByDataCy('dismiss-toast-btn').click();
      cy.getByDataCy('toast-notification').should('not.exist');
    });

    // This can happen if you start with an invoice then switch to receipts
    it('should prevent submitting receipts if missing items', () => {
      cy.intercept({
        method: 'POST',
        url: 'https://country-service.shopifycloud.com/graphql',
        query: { fixture: 'countries.json' },
      });
      cy.getByDataCy('radio-expense-type-INVOICE').click();
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New PayPal account').click();
      cy.getByDataCy('payee-country').click();
      cy.contains('[data-cy="select-option"]', 'Angola - AO').click();
      cy.get('input[data-cy="payee-address-address1"]').type('Street Name, 123');
      cy.get('input[data-cy="payee-address-city"]').type('Citycitycity');
      cy.get('input[name="payoutMethod.data.email"]').type('paypal-test@opencollective.com');
      cy.getByDataCy('expense-next').click();
      // Fill the form with valid data
      cy.get('input[name="description"]').type('March invoice');
      cy.get('input[name="items[0].description"]').type('Peeling potatoes');
      cy.get('input[name="items[0].amount"]').type('{selectall}4200');

      // Switch to receipt and acknowledge error
      cy.getByDataCy('radio-expense-type-RECEIPT').click();
      cy.getByDataCy('expense-next').click();
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('attachment-url-field').should('contain', 'Receipt required');
    });

    describe('submit on behalf', () => {
      let collective, expenseId;
      let inviteeEmail = randomEmail();

      it('can invite an existing user to submit an expense', () => {
        cy.getByDataCy('radio-expense-type-INVOICE').click();

        cy.getByDataCy('select-expense-payee').click();
        cy.get('input#input-payee').type('pia');
        cy.wait(2000);
        cy.get('#react-select-input-payee-option-0-0').click();

        cy.get('input[name="description"]').type('Service Invoice');
        cy.get('input[name="items[0].amount"]').type('{selectall}4200');

        cy.getByDataCy('expense-summary-btn').click();
        cy.wait(500);

        cy.getByDataCy('expense-status-msg').should('contain', 'DRAFT');
        cy.getByDataCy('expense-draft-banner').should('contain', 'Your invite is on its way');
        cy.getByDataCy('expense-draft-banner').should(
          'contain',
          `An invitation to submit this expense has been sent to`,
        );
      });

      it('can invite a third-party user to submit an expense', () => {
        cy.getByDataCy('radio-expense-type-INVOICE').click();

        cy.getByDataCy('select-expense-payee').click();
        cy.getByDataCy('collective-picker-invite-button').click();
        cy.get('input[name="payee.name"]').type('Nicolas Cage');
        cy.get('input[name="payee.email"]').type(inviteeEmail);
        cy.get('[data-cy="expense-next"]').click();

        cy.get('input[name="description"]').type('Service Invoice');
        cy.get('input[name="items[0].amount"]').type('{selectall}4200');

        cy.getByDataCy('expense-summary-btn').click();
        cy.wait(500);

        cy.getByDataCy('expense-status-msg').should('contain', 'DRAFT');
        cy.getByDataCy('expense-draft-banner').should('contain', 'Your invite is on its way');
        cy.getByDataCy('expense-draft-banner').should(
          'contain',
          `An invitation to submit this expense has been sent to ${inviteeEmail}`,
        );
        cy.getByDataCy('expense-summary-payee').should('contain', 'Nicolas Cage');

        // Log out and submit as invitee...
        cy.url({ log: true }).then(_url => {
          [, collective, expenseId] = _url.match(/\/([\w-]+)\/expenses\/(\w+)$/);
        });
      });

      it('can create a new expense and account as the invitee', () => {
        cy.visit(`/${collective}/expenses/${expenseId}?key=draft-key`);
        cy.logout();
        cy.reload();

        cy.getByDataCy('payee-country').click();
        cy.contains('[data-cy="select-option"]', 'Angola - AO').click();
        cy.get('[data-cy="payee-address-address1"]').type('Street Name, 123');
        cy.get('[data-cy="payee-address-city"]').type('City');

        cy.getByDataCy('payout-method-select').click();
        cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
        cy.get('textarea[name="payoutMethod.data.content"]').type('make it rain');

        cy.getByDataCy('expense-next').click();

        cy.get('input[name="items[0].description"]').type('That service');
        cy.getByDataCy('expense-summary-btn').click();
        cy.get('[data-cy="checkbox-tos"] [data-cy="custom-checkbox"]').click();
        cy.getByDataCy('save-expense-btn').click();
        cy.wait(500);
        cy.getByDataCy('expense-status-msg').should('contain', 'Pending');
        cy.getByDataCy('expense-status-msg').parent().should('contain', 'Unverified');
        cy.login({ email: inviteeEmail, redirect: `/${collective}/expenses/${expenseId}` });
        cy.visit(`/${collective}/expenses/${expenseId}`);
        cy.getByDataCy('expense-status-msg').should('contain', 'Pending');
        cy.getByDataCy('expense-author').should('contain', 'Invited by');
        cy.getByDataCy('expense-summary-payee').should('contain', 'Nicolas Cage');
        cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
        cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'make it rain');
      });

      it('can invite a third-party organization to submit an expense', () => {
        inviteeEmail = randomEmail();
        cy.getByDataCy('radio-expense-type-INVOICE').click();

        cy.getByDataCy('select-expense-payee').click();
        cy.getByDataCy('collective-picker-invite-button').click();
        cy.getByDataCy('payee-type-org').click();
        cy.get('input[name="payee.organization.name"]').type('Hollywood');
        cy.get('input[name="payee.organization.description"]').type('We make movies.');
        cy.get('input[name="payee.organization.website"]').type('http://hollywood.com');
        cy.get('input[name="payee.name"]').type('Nicolas Cage');
        cy.get('input[name="payee.email"]').type(inviteeEmail);
        cy.get('[data-cy="expense-next"]').click();

        cy.get('input[name="description"]').type('Service Invoice');
        cy.get('input[name="items[0].amount"]').type('{selectall}4200');

        cy.getByDataCy('expense-summary-btn').click();
        cy.wait(500);

        cy.getByDataCy('expense-status-msg').should('contain', 'DRAFT');
        cy.getByDataCy('expense-draft-banner').should('contain', 'Your invite is on its way');
        cy.getByDataCy('expense-draft-banner').should(
          'contain',
          `An invitation to submit this expense has been sent to ${inviteeEmail}`,
        );
        cy.getByDataCy('expense-summary-payee').should('contain', 'Hollywood');

        // Log out and submit as invitee...
        cy.url({ log: true }).then(_url => {
          [, collective, expenseId] = _url.match(/\/([\w-]+)\/expenses\/(\w+)$/);
        });
        cy.wait(500);
      });

      it('can create a new expense and organization account as the invitee', () => {
        cy.visit('/');
        cy.logout();
        cy.reload();
        cy.visit(`/${collective}/expenses/${expenseId}?key=draft-key`);

        cy.getByDataCy('payee-country').click();
        cy.contains('[data-cy="select-option"]', 'Angola - AO').click();
        cy.get('[data-cy="payee-address-address1"]').type('Street Name, 123');
        cy.get('[data-cy="payee-address-city"]').type('City');

        cy.getByDataCy('payout-method-select').click();
        cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
        cy.get('textarea[name="payoutMethod.data.content"]').type('make it rain');

        cy.getByDataCy('expense-next').click();

        cy.get('input[name="items[0].description"]').type('That service');
        cy.getByDataCy('expense-summary-btn').click();
        cy.get('[data-cy="checkbox-tos"] [data-cy="custom-checkbox"]').click();
        cy.getByDataCy('save-expense-btn').click();
        cy.wait(500);
        cy.getByDataCy('expense-status-msg').should('contain', 'Pending');
        cy.getByDataCy('expense-status-msg').parent().should('contain', 'Unverified');
        cy.login({ email: inviteeEmail, redirect: `/${collective}/expenses/${expenseId}` });
        cy.visit(`/${collective}/expenses/${expenseId}`);
        cy.getByDataCy('expense-status-msg').should('contain', 'Pending');
        cy.getByDataCy('expense-author').should('contain', 'Invited by');
        cy.getByDataCy('expense-summary-payee').should('contain', 'Hollywood');
        cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
        cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'make it rain');
      });
    });
  });

  describe('new expense with taxes', () => {
    let collective;

    before(() => {
      cy.createHostedCollective().then(c => (collective = c));
    });

    it('can submit with VAT', () => {
      // Activate VAT for collective
      cy.editCollective({
        id: collective.id,
        location: { country: 'BE' },
        settings: { VAT: { type: 'OWN', number: 'FRXX999999999' } },
      });

      cy.login({ redirect: `/${collective.slug}/expenses/new` });
      cy.getByDataCy('radio-expense-type-INVOICE').click();

      // ---- 1. Submit expense with VAT ----

      // Fill payee / payout method
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New PayPal account').click();
      cy.get('input[name="payoutMethod.data.email"]').type('paypal-test@opencollective.com');
      cy.getByDataCy('payee-country').click();
      cy.contains('[data-cy="select-option"]', 'Angola - AO').click();
      cy.get('input[data-cy="payee-address-address1"]').type('Street Name, 123');
      cy.get('input[data-cy="payee-address-city"]').type('Citycitycity');
      cy.getByDataCy('expense-next').click();

      // Fill details
      cy.get('input[name="description"]').type('Brussels January team retreat');
      cy.get('input[name="items[0].description"]').type('TShirts');
      cy.get('input[name="items[0].amount"]').type('{selectall}112');
      cy.getByDataCy('expense-add-item-btn').click();
      cy.get('input[name="items[1].description"]').type('Potatoes for the giant raclette');
      cy.get('input[name="items[1].amount"]').type('{selectall}75.5');

      // Need to fill in the tax rate before we can go next
      cy.get('input[name="taxes.0.idNumber"]').should('not.have.attr', 'required'); // Not required if the rate is not set or 0
      cy.getByDataCy('expense-items-total-amount').should('contain', '--.--');
      cy.getByDataCy('tax-VAT-expense-amount-line').should('contain', '--.--');
      cy.getByDataCy('expense-summary-btn').click();
      cy.get('input:invalid').should('have.length', 1);

      // Breakdown should be correct
      cy.get('input[name="taxes.0.rate"]').type('5.5');
      cy.get('input[name="taxes.0.idNumber"]').should('have.attr', 'required', 'required'); // Required if the rate is a positive number
      cy.get('input[name="taxes.0.idNumber"]').type('FRXX999999999');
      cy.getByDataCy('expense-invoiced-amount').should('contain', '$187.50');
      cy.getByDataCy('tax-VAT-expense-amount-line').should('contain', '$10.31');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$197.81');

      // Check summary
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('expense-invoiced-amount').should('contain', '$187.50');
      cy.getByDataCy('tax-VAT-expense-amount-line').should('contain', '$10.31');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$197.81');

      // Submit!
      cy.getByDataCy('submit-expense-btn').click();
      cy.contains('[data-cy="toast-notification"]', 'Expense submitted');
      cy.getByDataCy('expense-invoiced-amount').should('contain', '$187.50');
      cy.getByDataCy('tax-VAT-expense-amount-line').should('contain', '$10.31');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$197.81');

      // ---- 2. Edit VAT rate ----

      // Start editing
      cy.get('[data-cy="edit-expense-btn"]:visible').click();
      cy.getByDataCy('expense-next').click();

      // Add new item
      cy.getByDataCy('expense-add-item-btn').click();
      cy.get('input[name="items[2].description"]').type('Some more delicious stuff');
      cy.get('input[name="items[2].amount"]').type('{selectall}34');
      cy.getByDataCy('expense-invoiced-amount').should('contain', '$221.50');
      cy.getByDataCy('tax-VAT-expense-amount-line').should('contain', '$12.18');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$233.68');

      // Change tax rate
      cy.get('input[name="taxes.0.rate"]').type('{selectall}17.7');
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('save-expense-btn').click();
      cy.getByDataCy('save-expense-btn').should('not.exist'); // wait for form to be submitted

      // Check final expense page
      cy.getByDataCy('expense-invoiced-amount').should('contain', '$221.50');
      cy.getByDataCy('tax-VAT-expense-amount-line').should('contain', '$39.21');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$260.71');

      // ---- 3. Remove VAT ----
      // Start editing
      cy.get('[data-cy="edit-expense-btn"]:visible').click();
      cy.getByDataCy('expense-next').click();

      // Disable VAT
      cy.getByDataCy('checkbox-tax-VAT').click();
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('save-expense-btn').click();
      cy.getByDataCy('save-expense-btn').should('not.exist'); // wait for form to be submitted

      // Check final expense page
      cy.getByDataCy('expense-invoiced-amount').should('contain', '$221.50');
      cy.getByDataCy('tax-VAT-expense-amount-line').should('contain', '$39.21');
      cy.getByDataCy('expense-items-total-amount').should('contain', '$260.71');
    });
  });

  describe('Actions on expense', () => {
    let collective;
    let user;
    let expenseUrl;

    before(() => {
      cy.signup().then(response => (user = response));
    });

    before(() => {
      cy.createHostedCollective({ userEmail: user.email }).then(c => (collective = c));
    });

    beforeEach(() => {
      cy.createExpense({
        userEmail: user.email,
        account: { legacyId: collective.id },
        payee: { legacyId: user.CollectiveId },
      }).then(expense => (expenseUrl = `/${collective.slug}/expenses/${expense.legacyId}`));
    });

    it('Approve, unapprove, reject and pay actions on expense', () => {
      cy.visit(expenseUrl);
      cy.get('[data-cy="expense-status-msg"]').contains('Pending');
      cy.getByDataCy('approve-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Approved');
      cy.getByDataCy('unapprove-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Pending');
      cy.getByDataCy('approve-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Approved');
      cy.getByDataCy('unapprove-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Pending');
      cy.getByDataCy('reject-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Rejected');
    });

    it('Delete expense', () => {
      cy.login({ email: user.email, redirect: expenseUrl });
      cy.getByDataCy('reject-button').click();
      cy.get('[data-cy="expense-status-msg"]').contains('Rejected');

      // Now delete the expense
      cy.get('[data-cy="delete-expense-button"]:visible').click();
      cy.getByDataCy('confirmation-modal-continue').click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/${collective.slug}/expenses`);
      cy.visit(expenseUrl);
      cy.getByDataCy('error-page').contains('Not found');
    });
  });
});
