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
      cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
      cy.get('textarea[name="payoutMethod.data.content"]').type('Bank Account: 007');
      cy.getByDataCy('expense-next').click();

      cy.get('textarea[name="description"]').type('Brussels January team retreat');

      cy.getByDataCy('expense-summary-btn').should('be.disabled');
      // Upload 2 files to the multi-files dropzone

      cy.getByDataCy('expense-multi-attachments-dropzone').selectFile(
        {
          contents: 'test/cypress/fixtures/images/receipt.jpg',
          fileName: 'receipt0.jpg',
          mimeType: 'image/jpeg',
        },
        { action: 'drag-drop' },
      );
      cy.getByDataCy('expense-multi-attachments-dropzone').selectFile(
        {
          contents: 'test/cypress/fixtures/images/receipt.jpg',
          fileName: 'receipt1.jpg',
          mimeType: 'image/jpeg',
        },
        { action: 'drag-drop' },
      );
      cy.getByDataCy('expense-attachment-form').should('have.length', 2);

      // Fill info for first attachment
      cy.get('input[name="items[0].description"]').type('Fancy restaurant');
      cy.get('input[name="items[0].amount"]').type('{selectall}183');
      cy.getByDataCy('currency-picker').click();
      cy.contains('[data-cy="select-option"]', 'US Dollar').click();
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
      cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'Bank Account: 007');
      cy.getByDataCy('expense-summary-payout-method-type').should('contain', 'Other');
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
      cy.getByDataCy('more-actions').click();
      cy.getByDataCy('edit-expense-btn').click();
      cy.getByDataCy('expense-next').click();
      cy.get('textarea[name="description"]').type(' edited');
      cy.get('input[name="items[0].description"]').type(' but not too expensive');
      cy.get('input[name="items[0].amount"]').type('{selectall}111');
      // Add new item
      cy.getByDataCy('expense-add-item-btn').click();
      cy.get('input[name="items[2].description"]').type('Some more delicious stuff');
      cy.get('input[name="items[2].amount"]').type('{selectall}34');
      cy.getByDataCy('items[2].url-dropzone').selectFile(
        {
          contents: 'test/cypress/fixtures/images/receipt.jpg',
          fileName: 'receipt2.jpg',
          mimeType: 'image/jpeg',
        },
        { action: 'drag-drop' },
      );

      // Change payee - use a new organization
      cy.getByDataCy('expense-back').click();
      cy.getByDataCy('payout-method-select').click();
      cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
      cy.get('textarea[name="payoutMethod.data.content"]').type('Bank Account: 007');
      cy.getByDataCy('expense-next').click();
      cy.getByDataCy('currency-picker').click();
      cy.contains('[data-cy="select-option"]', 'US Dollar').click();
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('save-expense-btn').click();
      cy.getByDataCy('save-expense-btn').should('not.exist'); // wait for form to be submitted

      // Check final expense page
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat edited');
      cy.getByDataCy('expense-summary-payee').should('contain', 'Potatoes Lover');
      cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
      cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'Bank Account: 007');
      cy.getByDataCy('expense-summary-payout-method-type').should('contain', 'Other');
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

      cy.get('textarea[name="description"]').type('Brussels January team retreat');

      cy.getByDataCy('expense-multi-attachments-dropzone').selectFile(
        {
          contents: 'test/cypress/fixtures/images/receipt.jpg',
          fileName: 'receipt0.jpg',
          mimeType: 'image/jpeg',
        },
        { action: 'drag-drop' },
      );

      cy.getByDataCy('expense-multi-attachments-dropzone').selectFile(
        {
          contents: 'test/cypress/fixtures/images/receipt.jpg',
          fileName: 'receipt1.jpg',
          mimeType: 'image/jpeg',
        },
        { action: 'drag-drop' },
      );

      cy.getByDataCy('expense-attachment-form').should('have.length', 2);
      // Fill info for first attachment
      cy.get('input[name="items[0].description"]').type('Fancy restaurant');
      cy.get('input[name="items[0].amount"]').type('{selectall}183');
      cy.getByDataCy('currency-picker').click();
      cy.contains('[data-cy="select-option"]', 'US Dollar').click();
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
      cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
      cy.getByDataCy('country-select').click();
      cy.contains('[data-cy="select-option"]', 'Angola').click();
      cy.get('input[data-cy="address-address1"]').type('Street Name, 123');
      cy.get('input[data-cy="address-city"]').type('Citycitycity');
      cy.get('textarea[name="payoutMethod.data.content"]').type('Bank Account: 007');
      cy.getByDataCy('expense-next').click();
      // Fill the form with valid data
      cy.get('textarea[name="description"]').type('March invoice');
      cy.get('input[name="items[0].description"]').type('Peeling potatoes');
      cy.getByDataCy('currency-picker').click();
      cy.contains('[data-cy="select-option"]', 'US Dollar').click();
      cy.get('input[name="items[0].amount"]').type('{selectall}4200');

      // Switch to receipt and acknowledge error
      cy.getByDataCy('radio-expense-type-RECEIPT').click();
      cy.getByDataCy('expense-next').click();
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('attachment-url-field').should('contain', 'Receipt required');
    });

    describe('submit on behalf', () => {
      it('can invite an existing user to submit an expense', () => {
        cy.getByDataCy('radio-expense-type-INVOICE').click();

        cy.getByDataCy('select-expense-payee').click();
        cy.get('input#input-payee').type('pia');
        cy.get('#react-select-input-payee-option-0-0').contains('pia').click();
        cy.getByDataCy('expense-next').click();
        // TODO: Make sure there's no payout method input visible

        cy.get('textarea[name="description"]').type('Service Invoice');
        cy.get('input[name="items[0].amount"]').type('{selectall}4200');

        cy.getByDataCy('expense-summary-btn').click();
        cy.wait(500);

        cy.getByDataCy('expense-status-msg').should('contain', 'Draft');
        cy.getByDataCy('expense-draft-banner').should('contain', 'Your invite is on its way');
        cy.getByDataCy('expense-draft-banner').should(
          'contain',
          `An invitation to submit this expense has been sent to`,
        );
      });

      it('can invite a third-party user to submit an expense', () => {
        const inviteeEmail = randomEmail();
        cy.getByDataCy('radio-expense-type-INVOICE').click();

        cy.getByDataCy('select-expense-payee').click();
        cy.getByDataCy('collective-picker-invite-button').click();
        cy.get('input[name="payee.name"]').type('Nicolas Cage');
        cy.get('input[name="payee.email"]').type(inviteeEmail);
        cy.get('[data-cy="expense-next"]').click();

        cy.get('textarea[name="description"]').type('Service Invoice');
        cy.get('input[name="items[0].amount"]').type('{selectall}4200');

        cy.getByDataCy('expense-summary-btn').click();
        cy.wait(500);

        cy.getByDataCy('expense-status-msg').should('contain', 'Draft');
        cy.getByDataCy('expense-draft-banner').should('contain', 'Your invite is on its way');
        cy.getByDataCy('expense-draft-banner').should(
          'contain',
          `An invitation to submit this expense has been sent to ${inviteeEmail}`,
        );
        cy.getByDataCy('expense-summary-payee').should('contain', 'Nicolas Cage');

        // Log out and submit as invitee...
        cy.url({ log: true })
          .then(_url => {
            const [, collective, expenseId] = _url.match(/\/([\w-]+)\/expenses\/(\w+)$/);
            return { collective, expenseId };
          })
          .as('createdExpense');
        cy.logout();
        cy.reload();

        cy.get('@createdExpense').then(createdExpense => {
          cy.visit(`/${createdExpense.collective}/expenses/${createdExpense.expenseId}?key=draft-key`);
        });

        cy.getByDataCy('country-select').click();
        cy.contains('[data-cy="select-option"]', 'Angola').click();
        cy.get('[data-cy="address-address1"]').type('Street Name, 123');
        cy.get('[data-cy="address-city"]').type('City');

        cy.getByDataCy('payout-method-select').click();
        cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
        cy.get('textarea[name="payoutMethod.data.content"]').type('make it rain');

        cy.getByDataCy('expense-next').click();

        cy.get('input[name="items[0].description"]').type('That service');
        cy.getByDataCy('currency-picker').click();
        cy.contains('[data-cy="select-option"]', 'US Dollar').click();
        cy.getByDataCy('expense-summary-btn').click();
        cy.get('[data-cy="checkbox-tos"] [data-cy="custom-checkbox"]').click();
        cy.getByDataCy('save-expense-btn').click();
        cy.wait(500);
        cy.getByDataCy('expense-status-msg').should('contain', 'Pending');
        cy.getByDataCy('expense-status-msg').parent().should('contain', 'Unverified');

        cy.get('@createdExpense').then(createdExpense => {
          cy.login({
            email: inviteeEmail,
            redirect: `/${createdExpense.collective}/expenses/${createdExpense.expenseId}`,
          });
          cy.visit(`/${createdExpense.collective}/expenses/${createdExpense.expenseId}`);
        });

        cy.getByDataCy('expense-status-msg').should('contain', 'Pending');
        cy.getByDataCy('expense-author').should('contain', 'Invited by');
        cy.getByDataCy('expense-summary-payee').should('contain', 'Nicolas Cage');
        cy.getByDataCy('expense-summary-host').should('contain', 'Open Source Collective org');
        cy.getByDataCy('expense-summary-payout-method-data').should('contain', 'make it rain');
      });

      it('can invite a third-party organization to submit an expense', () => {
        const inviteeEmail = randomEmail();
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

        cy.get('textarea[name="description"]').type('Service Invoice');
        cy.get('input[name="items[0].amount"]').type('{selectall}4200');

        cy.getByDataCy('expense-summary-btn').click();
        cy.wait(500);

        cy.getByDataCy('expense-status-msg').should('contain', 'Draft');
        cy.getByDataCy('expense-draft-banner').should('contain', 'Your invite is on its way');
        cy.getByDataCy('expense-draft-banner').should(
          'contain',
          `An invitation to submit this expense has been sent to ${inviteeEmail}`,
        );
        cy.getByDataCy('expense-summary-payee').should('contain', 'Hollywood');

        // Log out and submit as invitee...
        cy.url({ log: true })
          .then(_url => {
            const [, collective, expenseId] = _url.match(/\/([\w-]+)\/expenses\/(\w+)$/);
            return { collective, expenseId };
          })
          .as('createdExpense');

        cy.visit('/');
        cy.logout();
        cy.reload();
        cy.get('@createdExpense').then(createdExpense => {
          cy.visit(`/${createdExpense.collective}/expenses/${createdExpense.expenseId}?key=draft-key`);
        });

        cy.getByDataCy('country-select').click();
        cy.contains('[data-cy="select-option"]', 'Angola').click();
        cy.get('[data-cy="address-address1"]').type('Street Name, 123');
        cy.get('[data-cy="address-city"]').type('City');

        cy.getByDataCy('payout-method-select').click();
        cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
        cy.get('textarea[name="payoutMethod.data.content"]').type('make it rain');

        cy.getByDataCy('expense-next').click();

        cy.get('input[name="items[0].description"]').type('That service');
        cy.getByDataCy('currency-picker').click();
        cy.contains('[data-cy="select-option"]', 'US Dollar').click();
        cy.getByDataCy('expense-summary-btn').click();
        cy.get('[data-cy="checkbox-tos"] [data-cy="custom-checkbox"]').click();
        cy.getByDataCy('save-expense-btn').click();
        cy.wait(500);
        cy.getByDataCy('expense-status-msg').should('contain', 'Pending');
        cy.getByDataCy('expense-status-msg').parent().should('contain', 'Unverified');
        cy.get('@createdExpense').then(createdExpense => {
          cy.login({
            email: inviteeEmail,
            redirect: `/${createdExpense.collective}/expenses/${createdExpense.expenseId}`,
          });
          cy.visit(`/${createdExpense.collective}/expenses/${createdExpense.expenseId}`);
        });
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
      cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
      cy.get('textarea[name="payoutMethod.data.content"]').type('Bank Account: 007');
      cy.getByDataCy('country-select').click();
      cy.contains('[data-cy="select-option"]', 'Angola').click();
      cy.get('input[data-cy="address-address1"]').type('Street Name, 123');
      cy.get('input[data-cy="address-city"]').type('Citycitycity');
      cy.getByDataCy('expense-next').click();

      // Fill details
      cy.get('textarea[name="description"]').type('Brussels January team retreat');
      cy.get('input[name="items[0].description"]').type('TShirts');
      cy.get('input[name="items[0].amount"]').type('{selectall}112');
      cy.getByDataCy('currency-picker').click();
      cy.contains('[data-cy="select-option"]', 'US Dollar').click();
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
      cy.getByDataCy('more-actions').click();
      cy.getByDataCy('edit-expense-btn').click({ force: true });
      cy.getByDataCy('expense-next').click();

      // Add new item
      cy.getByDataCy('currency-picker').click();
      cy.contains('[data-cy="select-option"]', 'US Dollar').click();
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
      cy.get('[data-cy="more-actions"]:visible').click();
      cy.getByDataCy('edit-expense-btn').click({ force: true });
      cy.getByDataCy('expense-next').click();

      // Disable VAT
      cy.getByDataCy('checkbox-tax-VAT').click();
      cy.getByDataCy('currency-picker').click();
      cy.contains('[data-cy="select-option"]', 'US Dollar').click();
      cy.getByDataCy('expense-summary-btn').click();
      cy.getByDataCy('save-expense-btn').click();
      cy.getByDataCy('save-expense-btn').should('not.exist'); // wait for form to be submitted

      // Check final expense page
      cy.getByDataCy('expense-items-total-amount').should('contain', '$221.50');
      cy.getByDataCy('expense-invoiced-amount').should('not.exist'); // No breakdown if there's no taxes
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
      cy.getByDataCy('more-actions').click();
      cy.getByDataCy('more-actions-delete-expense-btn').click();
      cy.getByDataCy('confirmation-modal-continue').click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/${collective.slug}/expenses`);
      cy.visit(expenseUrl);
      cy.getByDataCy('error-page').contains('Not found');
    });

    it('Displays expense policy', () => {
      cy.login({ email: user.email, redirect: expenseUrl });
      cy.get('[data-cy="edit-collective-btn"]:visible').click();
      cy.getByDataCy('menu-item-policies').click();
      cy.getByDataCy('expense-policy-input').type('this is my test expense policy');
      cy.getByDataCy('submit-policy-btn').click();
      cy.visit(expenseUrl);
      cy.get('[data-cy="collective-navbar-actions-btn"]:visible').click();
      cy.getByDataCy('submit-expense-dropdown').click();
      cy.getByDataCy('expense-policy-html').contains('this is my test expense policy');
    });

    it('Projects inherit and display expense policy from parent collective', () => {
      cy.login({ email: user.email, redirect: `/${collective.slug}/admin/policies` });
      cy.getByDataCy('expense-policy-input').type('this is my test expense policy');
      cy.getByDataCy('submit-policy-btn').click();
      cy.createProject({ userEmail: user.email, collective }).then(project => {
        cy.visit(`/${project.slug}/expenses/new`);
        cy.getByDataCy('expense-policy-html').contains('this is my test expense policy');
      });
    });
  });
});
