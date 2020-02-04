const collectiveName = 'New collective';

describe('create a collective', () => {
  it('edit info', () => {
    cy.signup({ redirect: '/create' });
    cy.get('.CollectiveCategoryPicker .category')
      .first()
      .click();
    cy.fillInputField('name', collectiveName);
    cy.fillInputField('description', 'short description for new collective');
    cy.fillInputField('website', 'https://newcollective.org');
    cy.wait(100);
    cy.get('.actions button').click();
    cy.get('.error').contains('Please accept the terms of service');
    cy.get('.tos input[name="tos"]').click();
    cy.get('.actions button').click();
    cy.get('.result').contains('Collective created successfully');
    cy.wait(800);
    cy.get('#createHost input[type="radio"]', { timeout: 20000 }).click();
    cy.get('#createHost .CreateHostForm');
    cy.get('select[name="hostType"]').select('organization');
    cy.fillInputField('organization_name', 'new org');
    cy.fillInputField('organization_website', 'newco.com');
    cy.wait(300);
    cy.get('#createHost .createOrganizationBtn').click();
    cy.wait(300);
    cy.get('#createHost .inputField.HostCollectiveId', {
      timeout: 10000,
    }).contains('new org');
    cy.get('#createHost .EditConnectedAccount .btn').contains('Connect Stripe');
    cy.get('#findHost input[type="radio"]').click();
    cy.get('#findHost a[href="/hosts"]').click();
    cy.get('.CollectiveCard', { timeout: 10000 }).should('have.length', 11);
    cy.get('.CollectiveCard')
      .first()
      .contains('collectives hosted');
    cy.get('.CollectiveCard')
      .first()
      .click();
    cy.wait(300);
    cy.contains('Host fee: 0%');
    cy.get('[data-cy="host-apply-btn"]').should('not.be.disabled');
    cy.contains('[data-cy="host-apply-btn"]:visible', 'Apply with New collective').click();
    cy.get('.ApplyToHostBtn').contains(`Application pending for ${collectiveName}`);
    // Go back to collective page
    cy.get('.ApplyToHostBtn:visible a')
      .first()
      .click();
    // Click on edit collective
    cy.get('[data-cy="edit-collective-btn"]').click();
    cy.getByDataCy('menu-item-host', { timeout: 10000 }).click();
    cy.get('.removeHostBtn').click();
    cy.get('[data-cy=continue]').click();
    cy.get('#noHost input:checked');
  });
});
