describe('New Expense Flow comments', () => {
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
      payee: { legacyId: user.CollectiveId },
      account: { legacyId: collective.id },
    }).then(expense => (expenseUrl = `/${collective.slug}/expenses/${expense.legacyId}`));
  });

  it('Add, Edit and delete comment', () => {
    cy.visit(expenseUrl);

    // Adding a comment
    cy.get('[data-cy="RichTextEditor"] trix-editor').as('editor');
    cy.get('@editor').type('I am typing a comment');
    cy.getByDataCy('submit-comment-btn').click();
    cy.get('[data-cy="comment-body"]:nth-child(1) > div').contains('I am typing a comment');
    cy.reload();
    cy.get('[data-cy="comment-body"]:nth-child(1) > div').contains('I am typing a comment');

    // Editing the same comment
    cy.get('[data-cy="comment"]:nth-child(1)').within(() => {
      cy.getByDataCy('commnent-actions-trigger').click();
      cy.getByDataCy('edit-comment-btn').click();
      cy.get('[data-cy="RichTextEditor"] trix-editor').as('editor');
      cy.get('@editor').type('Modifying my first comment');
      cy.getByDataCy('InlineEditField-Btn-Save').click();
    });

    // Now deleting my comment
    cy.getByDataCy('commnent-actions-trigger').click();
    cy.getByDataCy('delete-comment-btn').click();
    cy.getByDataCy('confirmation-modal-continue').click();

    // No comments left and hence no thread
    cy.getByDataCy('comment').should('not.exist');
    cy.getByDataCy('comment-body').should('not.exist');
  });

  it('Add reactions', () => {
    cy.login({ redirect: expenseUrl, email: user.email });
    cy.get('[data-cy="RichTextEditor"] trix-editor').as('editor');
    cy.get('@editor').type('Add emojis here ⬇️⬇️⬇️');
    cy.getByDataCy('submit-comment-btn').click();
    cy.getByDataCy('comment-reaction-picker-trigger').click();
    cy.contains('[data-cy="comment-reaction-picker-popper"] button', '👍️').click({ force: true });
    cy.getByDataCy('comment-reactions').contains('👍️ 1');
  });
});
