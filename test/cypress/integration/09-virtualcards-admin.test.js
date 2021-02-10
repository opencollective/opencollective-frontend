describe('Virtual cards admin', () => {
  let collectiveSlug = null;

  before(() => {
    cy.createCollective({ type: 'ORGANIZATION' }).then(collective => {
      collectiveSlug = collective.slug;
      cy.addCreditCardToCollective({ collectiveSlug });
    });
  });

  it('start with empty gift cards list', () => {
    cy.login({ redirect: `/${collectiveSlug}/edit/gift-cards` });
    cy.getByDataCy('virtualcards-list').contains('Create your first gift card!');
  });

  it('create gift card codes', () => {
    const numberOfVirtualCards = 20;
    const paginationSize = 15;
    const numberOfPages = Math.trunc(numberOfVirtualCards / paginationSize + 1);

    cy.login({ redirect: `/${collectiveSlug}/edit/gift-cards-create` });

    // Fill form
    cy.get('#virtualcard-amount').type('42');
    cy.get('.deliver-type-selector label[data-name="manual"] .radio-btn').click();
    cy.get('#virtualcard-numberOfVirtualCards').type(`{selectall}${numberOfVirtualCards}`);
    cy.getByDataCy('submit-new-virtualcards').click();

    // Success page
    cy.contains(`Your ${numberOfVirtualCards} gift cards have been created.`);
    cy.get('textarea.result-redeem-links').should($textareas => {
      // Ensure we have all the generated links
      expect($textareas).to.have.length(1);
      const $textarea = $textareas.first();
      const links = $textarea.val().split('\n');
      expect(links).to.have.lengthOf(numberOfVirtualCards);
    });

    // Links should also be added to gift cards list
    cy.contains('a[href$="/edit/gift-cards"]', 'Back to Gift Cards list').click();
    cy.getByDataCy('vc-details').should($virtualCards => {
      expect($virtualCards).to.have.length(paginationSize);
    });

    // Should have pagination
    cy.get('.vc-pagination').contains(`of ${numberOfPages}`);
  });

  it('send gift cards by emails', () => {
    cy.login({ redirect: `/${collectiveSlug}/edit/gift-cards-create` });

    // Button should be disabled until we add emails
    checkSubmit(false, 'Create 0 gift cards');

    // Multi-email tests
    const multiEmailSelector = '.virtualcards-recipients .public-DraftEditor-content';
    cy.get(multiEmailSelector).type('test1@opencollective.com');
    checkSubmit(true, 'Create 1 gift cards');
    // De-duplicate
    cy.get(multiEmailSelector).type(' test1@opencollective.com');
    checkSubmit(true, 'Create 1 gift cards');
    // Show invalid emails
    cy.get(multiEmailSelector).type(' Everybody Love Cats');
    cy.get('#virtualcard-amount').focus(); // focus another field to trigger validation
    cy.get('.multiemails-errors').contains('Invalid emails: Everybody, Love, Cats');
    checkSubmit(false, 'Create 1 gift cards');

    // Let's complete and submit this form
    cy.get(multiEmailSelector).type(
      '{selectall} test1@opencollective.com test2@opencollective.com test3@opencollective.com',
    );
    cy.get('#virtualcard-amount').type('{selectall}').type('12');
    checkSubmit(true, 'Create 3 gift cards');
    cy.getByDataCy('submit-new-virtualcards').click();
    cy.contains('Your 3 gift cards have been sent!');
    cy.getByDataCy('back-to-giftcards-list').click();
    cy.getByDataCy('virtualcards-list').contains('$12.00 sent to test3@opencollective.com');
  });
});

function checkSubmit(enabled, message) {
  cy.getByDataCy('submit-new-virtualcards')
    .should(`be.${enabled ? 'enabled' : 'disabled'}`)
    .contains(message);
}
