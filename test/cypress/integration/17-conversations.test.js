describe('Conversations', () => {
  let collective;

  before(() => {
    cy.createCollective({
      type: 'COLLECTIVE',
      settings: { features: { conversations: true } },
    }).then(c => (collective = c));
  });

  describe('Create conversation', () => {
    it('Can use rich formatting', () => {
      cy.login({ redirect: `/${collective.slug}/conversations/new` });
      cy.get('[data-cy="RichTextEditor"] trix-editor', { timeout: 30000 }).as('editor');
      cy.get('@editor').type('Hello from https://opencollective.com/opencollective 👋👋👋');
      cy.get('@editor').should(
        'have.html',
        '<div><!--block-->Hello from <a href="https://opencollective.com/opencollective">https://opencollective.com/opencollective</a>&nbsp;👋👋👋</div>',
      );
    });
  });
});
