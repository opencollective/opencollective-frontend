describe('create an update', () => {
  before(() => {
    cy.login({ redirect: '/testcollective/updates/new' });
  });

  it('edit info', () => {
    cy.wait(1000);
    cy.fillInputField('title', 'New update');
    cy.get('.ql-editor').type('This is some bold HTML{selectall}');
    cy.get('.ql-bold').click();
    cy.wait(300);
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.get('.UpdatePage .title', { timeout: 10000 }).contains('New update');
    cy.get('.UpdatePage .meta').contains('draft');
    cy.get('.UpdatePage .meta')
      .get('#privateIcon')
      .should('not.exist');
    cy.get('.UpdatePage .PublishUpdateBtn').contains('Your update will be sent to');
    cy.get('.UpdatePage button.publish').click();
    cy.get('.UpdatePage .meta')
      .contains('draft')
      .should('not.exist');

    cy.get('.UpdatePage .toggleEditUpdate').click();
    cy.wait(300);
    cy.get('.custom-checkbox').click(); // Make private
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.get('.UpdatePage .meta')
      .get('#privateIcon')
      .should('exist');
  });
});

describe('random user cannot see update', () => {
  it('cannot view private update', () => {
    cy.visit('/testcollective/updates');
    cy.get('.title a')
      .first()
      .click(); // The update created in the describe block above.
    cy.wait(500);
    cy.get('.UpdatePage .body').contains('Become a backer of Test Collective to see this update');
  });
});
