describe('New Expense Flow comments', () => {
  describe('Add, Edit and Delete comment', () => {
    let collectiveSlug;

    before(() => {
      cy.createHostedCollective().then(collective => {
        collectiveSlug = collective.slug;
        cy.login();
        cy.visit(`/${collectiveSlug}/expenses/new/v2`);
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
      });
    });
    beforeEach(() => {
      cy.login();
    });
    it('Add, Edit and delete actions', () => {
      cy.visit(`/${collectiveSlug}/expenses/v2`);
      cy.wait(100);
      cy.get('[data-cy="single-expense"]:nth-child(1) [data-cy="expense-link"]').click({ force: true });
      cy.contains('[data-cy="expense-page-content"]', 'Brussels January team retreat');

      // Adding a comment
      cy.get('[data-cy="RichTextEditor"] trix-editor').as('editor');
      cy.get('@editor').type('I am typing a comment');
      cy.getByDataCy('submit-comment-btn').click();
      cy.get('[data-cy="comment-body"]:nth-child(1) > div').contains('I am typing a comment');
      cy.reload();
      cy.get('[data-cy="comment-body"]:nth-child(1) > div').contains('I am typing a comment');
      // Editing the same comment

      cy.get('[data-cy="comment"]:nth-child(1)').within(() => {
        cy.get('[data-cy="Comment-button"] > span').contains('Edit').click();
        cy.get('[data-cy="RichTextEditor"] trix-editor').as('editor');
        cy.get('@editor').type('Modifying my first comment');
        cy.getByDataCy('InlineEditField-Btn-Save').click();
      });

      // Now deleting my comment
      cy.get('[data-cy="Comment-button"] > span').contains('Delete').click();
      cy.getByDataCy('confirmation-modal-continue').click();

      // No comments left and hence no thread
      cy.getByDataCy('comment').should('not.exist');
      cy.getByDataCy('comment-body').should('not.exist');
    });
  });
});

describe('Legacy Expense Flow comments ', () => {
  describe('Expense Comments', () => {
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
        user: { paypalEmail: 'paypal@test.com', id: user.id },
        collective: { id: collective.id },
      }).then(expense => (expenseUrl = `/${collective.slug}/expenses/${expense.id}/legacy`));
    });

    function SubmitComment(description) {
      cy.getByDataCy('CommentForm').within(() => {
        cy.get('[data-cy="RichTextEditor"] trix-editor').as('editor');
        cy.get('@editor').type(description);
        cy.getByDataCy('SaveCommentButton').click();
      });

      cy.contains('[data-cy="comment-body"]', description);
    }

    it('creates, edits and deletes a comment', () => {
      cy.visit(expenseUrl);
      // Create comment
      SubmitComment('This is a first comment');

      const checkCommentWasSaved = description => {
        cy.get('.Comments .itemsList .comment').should('have.length', 1);
        cy.get('.Comments .itemsList .comment:first .description').contains(description);
      };

      // Check comment was create in the local cache.
      checkCommentWasSaved('This is a first comment');
      cy.reload();
      // Check comment was create in the backend.
      checkCommentWasSaved('This is a first comment');

      // Edit comment
      cy.get('.Comments .itemsList .comment:first').within(() => {
        cy.getByDataCy('ToggleEditComment').click();
        cy.get('[data-cy="RichTextEditor"] trix-editor').as('editor');
        cy.get('@editor').type('Modifying my first comment');
        cy.getByDataCy('SaveEditionCommentButton').click();
      });

      // Check comment was modified in the local cache.
      checkCommentWasSaved('Modifying my first comment');
      cy.reload();
      // Check comment was modified in the backend.
      checkCommentWasSaved('Modifying my first comment');

      // Delete comment.
      cy.get('.Comments .itemsList .comment:first').within(() => {
        cy.getByDataCy('ToggleDeleteComment').click();
      });
      // Click the delete button on the delete comment modal.
      cy.getByDataCy('confirmation-modal-continue').click();

      // Check comment was deleted in the local cache.
      cy.get('.Comments .itemsList .comment').should('have.length', 0);
      cy.reload();
      // Check comment was deleted in the backend.
      cy.get('.Comments .itemsList .comment').should('have.length', 0);
    });

    it('loads more comments', () => {
      cy.login({ email: user.email, redirect: expenseUrl });
      const TOTAL_COMMENTS = 25;
      const COMMENTS_PER_PAGE = 10;

      // Submit a bunch of comments
      for (let i = 0; i < TOTAL_COMMENTS; i++) {
        SubmitComment(i);
      }
      cy.reload();

      const checkCommentCount = count => cy.get('.Comments .itemsList .comment').should('have.length', count);

      // Check there is the amount of comments per page.
      checkCommentCount(COMMENTS_PER_PAGE);

      // Load more comments
      cy.getByDataCy('LoadMoreButton').click();

      // Check there is the double of the amount of comments per page.
      checkCommentCount(COMMENTS_PER_PAGE * 2);

      // Load more comments
      cy.getByDataCy('LoadMoreButton').click();

      // Check there is the total amount of comments.
      checkCommentCount(TOTAL_COMMENTS);
    });
  });
});
