describe('create an update', () => {
  before(() => {
    cy.login({ redirect: '/dashboard/testcollective/updates/new' });
  });

  it('create draft, publish update and edit it', () => {
    cy.get('[data-cy=update-title]').type('New update');
    cy.get('[data-cy="update-content-editor"] trix-editor').as('editor');
    cy.get('[data-cy="update-content-editor"] trix-toolbar').as('toolbar');
    cy.get('@editor').type('This is some bold HTML{selectall}');
    cy.get('@toolbar').find('.trix-button--icon-bold').click();
    cy.getByDataCy('update-save-draft-btn').click();
    cy.get('[data-cy=update] header h1', { timeout: 10000 }).contains('New update');
    cy.get('[data-cy=update] header').contains('Draft');
    cy.getByDataCy('update-edit-btn').click();
    cy.getByDataCy('update-publish-btn').click();
    cy.get('[data-cy=update-audience-breakdown]').contains('Your Update will be sent to a total of 1 emails');
    cy.get('[data-cy=update-audience-breakdown]').contains('1 core contributor');
    cy.getByDataCy('confirmation-modal-continue').click();
    cy.get('[data-cy=update] header').contains('Published');
    cy.get('[data-cy=update] header').contains('Draft').should('not.exist');

    cy.get('[data-cy=update-edit-btn').click();
    cy.wait(300);
    cy.get('[data-cy="update-type-select"').click(); // Make private
    cy.get('[data-cy="update-type-private"').click(); // Make private
    cy.getByDataCy('update-save-btn').click();
    cy.wait(1000);
    cy.get('[data-cy=update] header').contains('Private');
  });
});

describe('random user cannot see update', () => {
  it('cannot view private update', () => {
    cy.signup({ redirect: '/testcollective/updates' });
    cy.get('[data-cy=updateTitle]').first().click(); // The update created in the describe block above.
    cy.get('[data-cy=mesgBox]').contains('Contribute to');
    cy.get('[data-cy=mesgBox]').contains('to see this Update');
  });
});
