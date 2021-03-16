describe('create an update', () => {
  before(() => {
    cy.login({ redirect: '/testcollective/updates/new' });
  });

  it('edit info', () => {
    cy.get('[data-cy=titleInput]').type('New update');
    cy.get('[data-cy="update-content-editor"] trix-editor').as('editor');
    cy.get('[data-cy="update-content-editor"] trix-toolbar').as('toolbar');
    cy.get('@editor').type('This is some bold HTML{selectall}');
    cy.get('@toolbar').find('.trix-button--icon-bold').click();
    cy.wait(100);
    cy.getByDataCy('edit-update-submit-btn').click();
    cy.wait(1000);
    cy.get('[data-cy=updateTitle]', { timeout: 10000 }).contains('New update');
    cy.get('[data-cy=meta]').contains('draft');
    cy.get('[data-cy="privateIcon"]').should('not.exist');
    cy.get('[data-cy=update-audience-breakdown]').contains('Your Update will be sent to a total of 1 emails');
    cy.get('[data-cy=update-audience-breakdown]').contains('1 individual');
    cy.getByDataCy('btn-publish').click();
    cy.getByDataCy('confirmation-modal-continue').click();
    cy.get('[data-cy=meta]').contains('draft').should('not.exist');

    cy.get('[data-cy=toggleEditUpdate').click();
    cy.wait(300);
    cy.get('[data-cy="custom-checkbox"').click(); // Make private
    cy.getByDataCy('edit-update-submit-btn').click();
    cy.wait(1000);
    cy.get('[data-cy="privateIcon"]').should('exist');
  });
});

describe('random user cannot see update', () => {
  it('cannot view private update', () => {
    cy.visit('/testcollective/updates');
    cy.get('[data-cy=updateTitle]').first().click(); // The update created in the describe block above.
    cy.wait(500);
    cy.get('[data-cy=mesgBox]').contains('Contribute to');
    cy.get('[data-cy=mesgBox]').contains('to see this Update');
  });
});
