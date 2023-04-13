describe('create a collective', () => {
  beforeEach(() => {
    cy.signup({ redirect: '/create' });
  });

  it('Picks a category and fills out the Create Collective Form', () => {
    cy.getByDataCy('ccf-category-picker-button-community').click();
    cy.getByDataCy('ccf-form-name').type('Bees are neat');
    cy.getByDataCy('ccf-form-slug')
      .first()
      .find('input')
      .invoke('val')
      .then(sometext => expect(sometext).to.equal('bees-are-neat'));
    cy.getByDataCy('ccf-form-description').type('We are going to save the bees');
    cy.get('[data-cy="custom-checkbox"').click();
    cy.get('[data-cy=ccf-form-submit]').click();
    cy.url().should('include', '/bees-are-neat/onboarding');
  });

  it('Cannot create a collective with a slug that is taken', () => {
    cy.getByDataCy('ccf-category-picker-button-community').click();
    cy.getByDataCy('ccf-form-name').type('Bees are neat');
    cy.getByDataCy('ccf-form-description').type('I just really like them');
    cy.get('[data-cy="custom-checkbox"').click();
    cy.get('[data-cy=ccf-form-submit]').click();
    cy.get('[data-cy=ccf-error-message]').contains(
      'An account already exists for this URL, please choose another one.',
    );
  });

  it('Can create a collective with tags and checks whether the added tags are shown in collective page', () => {
    cy.getByDataCy('ccf-category-picker-button-community').click();
    cy.getByDataCy('ccf-form-name').type('Bees are vicious');
    cy.getByDataCy('ccf-form-description').type('I do not like them');
    cy.get('[data-cy=tags-select]').click();
    cy.get('[data-cy=tags-select-option-meetup]').click();
    cy.get('[data-cy=tags-select-input]').type('opencollective-tag{enter}{esc}', { delay: 750 });
    cy.get('[data-cy=ccf-form-tags]').contains('opencollective-tag');
    cy.get('[data-cy="custom-checkbox"').click();
    cy.get('[data-cy=ccf-form-submit]').click();
    cy.visit('/bees-are-vicious');
    cy.get('[data-cy=collective-tags]').contains('opencollective-tag');
    cy.get('[data-cy=collective-tags]').contains('meetup');
    cy.get('[data-cy=collective-tags]').contains('COLLECTIVE');
  });
});
