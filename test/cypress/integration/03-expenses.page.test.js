import { randomSlug } from '../support/faker';

describe('New expsense flow ', () => {
  const collectiveSlug = randomSlug();

  before(() => {
    // Inital setup Creating a mock collective
    cy.login({ redirect: '/brusselstogetherasbl' });
    cy.get('[data-cy="host-apply-btn"]:visible').click();
    cy.get(`input[name="name"]`).type('new-collective');
    cy.get(`input[name="slug"]`).type(collectiveSlug);
    cy.get(`input[name="description"]`).type('short description for new collective');
    cy.get('[data-cy="custom-checkbox"]').click();
    cy.wait(300);
    cy.get('button[type="submit"]').click();
    cy.wait(1000);

    // Creating some expense to play around

    cy.visit(`/new-collective${collectiveSlug}/expenses/new/v2`);
    cy.wait(200);
    cy.getByDataCy('radio-expense-type-RECEIPT').click();
    cy.get('input[name="description"]').type('Brussels January team retreat');
    cy.getByDataCy('styled-input-tags-open').click();
    cy.getByDataCy('styled-input-tags-input').type('first{enter}{enter}');
    cy.getByDataCy('styled-input-tags-open').click();
    cy.getByDataCy('styled-input-tags-input').type('all{enter}{enter}');

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

    // Do this again for second expense
    cy.wait(300);
    cy.visit(`/new-collective${collectiveSlug}/expenses/new/v2`);
    cy.wait(200);
    cy.getByDataCy('radio-expense-type-RECEIPT').click();
    cy.get('input[name="description"]').clear().type('May Invoice');
    cy.getByDataCy('styled-input-tags-open').click();
    cy.getByDataCy('styled-input-tags-input').type('second{enter}{enter}');
    cy.getByDataCy('styled-input-tags-open').click();
    cy.getByDataCy('styled-input-tags-input').type('all{enter}{enter}');

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
    cy.get('input[name="items[0].amount"]').type('{selectall}123');
    cy.getByDataCy('expense-summary-btn').should('be.disabled');
    cy.get('input:invalid').should('have.length', 2); // Missing attachment desctiption+amount
    cy.getByDataCy('expense-items-total-amount').should('contain', '--.--'); // amount for second item is missing

    // Select Payout Method
    cy.getByDataCy('payout-method-select').click();
    cy.contains('[data-cy="select-option"]', 'New custom payout method').click();
    cy.get('[data-cy="payout-other-info"]').type('A simple thanks would work');
    // cy.get('input[name="privateMessage"]').type('A simple thanks would work');
    cy.get('input[name="items[1].description"]').type('Potatoes for the giant raclette');
    cy.get('input[name="items[1].amount"]').type('{selectall}12.50');
    cy.getByDataCy('expense-summary-btn').click();

    // Submit!
    cy.getByDataCy('submit-expense-btn').click();
    cy.contains('[data-cy="temporary-notification"]', 'Expense submited!');
    cy.contains('[data-cy="expense-page-content"]', 'May Invoice');
    cy.getByDataCy('dismiss-temporary-notification-btn').click();
    cy.getByDataCy('temporary-notification').should('not.exist');
  });

  it('shows the /expenses page', () => {
    cy.visit(`/new-collective${collectiveSlug}/expenses/v2`);
    cy.wait(100);
    cy.get('[data-cy="single-expense"]').should('have.length', 2);
    cy.get('[data-cy="single-expense"]:nth-child(1) [data-cy="expense-link"]').click({ force: true });
    cy.contains('[data-cy="expense-page-content"]', 'May Invoice');
  });

  it('Filter based on tag', () => {
    cy.visit(`/new-collective${collectiveSlug}/expenses/v2`);
    cy.wait(100);
    cy.get('[data-cy="single-expense"]').should('have.length', 2);

    // Filter based on tag=first
    cy.get('[data-cy="expense-tags-link"] > div').contains('first').click();
    cy.get('[data-cy="single-expense"]').should('have.length', 1);

    // Filter based on tag=all
    cy.get('[data-cy="expense-tags-link"] > div').contains('all').click();
    cy.get('[data-cy="single-expense"]').should('have.length', 2);

    // Filter based on tag=second
    cy.get('[data-cy="expense-tags-link"] > div').contains('second').click();
    cy.get('[data-cy="single-expense"]').should('have.length', 1);

    // Remove all filters
    cy.get('[data-cy="expense-tags-link"] > div').contains('second').click();

    // Now filter based on reciept
    cy.get('[data-cy="expense-type-tag"] > div').contains('Receipt').click();
    cy.get('[data-cy="single-expense"]').should('have.length', 2);

    // Now filter based on inovice
    cy.get('[data-cy="expense-type-tag"] > div').contains('Invoice').click();
    // No invoice and hence info message
    cy.get('[data-cy="zero-expense-message"]').contains('No expense matches the given filters');
  });
});

describe('expenses.page.test.js', () => {
  it('shows the /expenses page', () => {
    cy.visit('/railsgirlsatl/expenses');
    cy.wait(100);
    cy.get('.Expenses .expense').should('have.length', 20);
    cy.get('.ExpensesStats .categories li:nth-child(3) a').click();
    cy.get('.Expenses .expense').should('have.length', 5);
  });
});
