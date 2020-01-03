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
    }).then(expense => (expenseUrl = `/${collective.slug}/expenses/${expense.id}`));
  });

  function SubmitComment(description) {
    cy.getByDataCy('CommentForm').within(() => {
      cy.get('[data-cy="RichTextEditor"] trix-editor').as('editor');
      cy.get('@editor').type(description);
      cy.wait(50);
      cy.getByDataCy('SaveCommentButton').click();
    });
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
    cy.wait(100);
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
