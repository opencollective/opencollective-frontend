describe('Conversations', () => {
  let collective;

  before(() => {
    cy.createCollective({
      type: 'COLLECTIVE',
      settings: { features: { conversations: true } },
    }).then(c => (collective = c));
  });

  describe('Create conversation', () => {
    it('Creates the conversation then redirects to the conversation page', () => {
      cy.login({ redirect: `/${collective.slug}/conversations/new` });

      // Add a title
      cy.getByDataCy('conversation-title-input').type('Hello World 👋');

      // Test rich text formatting
      cy.get('[data-cy="RichTextEditor"] trix-editor', { timeout: 30000 }).as('editor');
      cy.get('@editor').type(
        'Hello from https://opencollective.com/opencollective 👋👋👋\nLorem ipsum dolor sit amet, consectetur adipiscing elit. De hominibus dici non necesse est. Immo alio genere; Si longus, levis; Quicquid enim a sapientia proficiscitur, id continuo debet expletum esse omnibus suis partibus.',
      );
      cy.get('@editor').should(
        'have.html',
        '<div><!--block-->Hello from <a href="https://opencollective.com/opencollective">https://opencollective.com/opencollective</a> 👋👋👋</div><div><!--block-->Lorem ipsum dolor sit amet, consectetur adipiscing elit. De hominibus dici non necesse est. Immo alio genere; Si longus, levis; Quicquid enim a sapientia proficiscitur, id continuo debet expletum esse omnibus suis partibus.</div>',
      );

      // Add tags
      cy.getByDataCy('styled-input-tags-open').click();
      cy.getByDataCy('styled-input-tags-input').type('amazing stuff{enter}{enter}');

      // Save then redirects to the conversation page
      cy.getByDataCy('submit-new-conversation-btn').click();
      cy.getByDataCy('conversation-page').click();

      // Conversation page
      cy.contains('Hello World 👋');
      cy.getByDataCy('comment-body').should(
        'have.html',
        '<div>Hello from <a href="https://opencollective.com/opencollective">https://opencollective.com/opencollective</a> 👋👋👋</div><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. De hominibus dici non necesse est. Immo alio genere; Si longus, levis; Quicquid enim a sapientia proficiscitur, id continuo debet expletum esse omnibus suis partibus.</div>',
      );

      // Edit tags
      const sampleTag = 'alot more amazing stuff';
      cy.getByDataCy('InlineEditField-Trigger-tags').click();
      cy.getByDataCy('styled-input-tags-open').click();
      cy.getByDataCy('styled-input-tags-input').type(`${sampleTag}{enter}`).blur();
      cy.contains(`${sampleTag}`.toLowerCase());

      // Add comment
      cy.get('[data-cy="comment-form"] [data-cy="RichTextEditor"] trix-editor').as('comment-editor');
      cy.get('@comment-editor').type('I post a reply');
      cy.getByDataCy('submit-comment-btn').click();
      cy.get('@comment-editor').type('And another one');
      cy.getByDataCy('submit-comment-btn').click();

      // Go to the conversations list
      cy.contains('a', 'Back to conversations').click();
      cy.getByDataCy('page-conversations');
      cy.contains('Hello World 👋');
      cy.getByDataCy('replies-count').contains('2');
      cy.getByDataCy('conversation-preview').should(
        'have.html',
        'Hello from <a href="https://opencollective.com/opencollective">https://opencollective.com/opencollective</a> 👋👋👋Lorem ipsum dolor sit amet, consectetur adipiscing elit. De hominibus dici non necesse est. Immo alio genere; Si longus, levi...',
      );
    });
  });
});
