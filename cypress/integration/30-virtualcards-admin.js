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
    cy.get('.virtualcards-list').contains('Create your first gift card!');
  });

  it('create gift card codes', () => {
    cy.login({ redirect: `/${collectiveSlug}/edit/gift-cards-create` });
    cy.get('#virtualcard-amount').type('42');
    cy.get('#virtualcard-numberOfVirtualCards').type('{selectall}5');
    cy.get('.FormInputs button[type="submit"]').click();
    cy.contains('Your 5 gift cards are ready!');
  });

  it('send gift cards by emails', () => {
    cy.login({ redirect: `/${collectiveSlug}/edit/gift-cards-send` });

    // Button should be disabled untill we add emails
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
    cy.get('#virtualcard-amount').type('12');
    checkSubmit(true, 'Create 3 gift cards');
    cy.get('.FormInputs button[type="submit"]').click();
    cy.contains('Your 3 gift cards have been sent!');
  });
});

function checkSubmit(enabled, message) {
  cy.get('.FormInputs button[type="submit"]')
    .should(`be.${enabled ? 'enabled' : 'disabled'}`)
    .contains(message);
}
