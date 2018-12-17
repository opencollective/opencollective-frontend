const collectiveName = 'New collective';

describe('create a collective', () => {
  it('edit info', () => {
    cy.login({ email: 'testuser@opencollective.com', redirect: '/create' });
    cy.get('.CollectiveCategoryPicker .category')
      .first()
      .click();
    cy.fillInputField('name', collectiveName);
    cy.fillInputField('description', 'short description for new collective');
    cy.fillInputField('website', 'https://newcollective.org');
    cy.wait(100);
    cy.get('.actions button').click();
    cy.get('.error').contains('Please accept the terms of service');
    cy.get('.tos input[name="tos"]').click({ force: true });
    cy.get('.actions button').click();
    cy.get('.result').contains('Collective created successfully');
    cy.wait(800);
    cy.get('#createHost input[type="radio"]').click();
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
    cy.get('.ApplyToHostBtn', { timeout: 15000 }).contains('0% host fee');
    cy.get('.LoggedInUser .ApplyToHostBtn .Button:enabled').contains('Apply to host your collective New collective');
    cy.get('.LoggedInUser .ApplyToHostBtn .Button:enabled').click({
      force: true,
    });
    cy.get('.LoggedInUser .ApplyToHostBtn').contains(`Application pending for ${collectiveName}`);
    // Go back to collective page
    cy.get('.LoggedInUser .ApplyToHostBtn a')
      .first()
      .click({ force: true });
    // Click on edit collective
    cy.get('.desktopOnly .editCollective a').click({ force: true });
    cy.get('.MenuItem.host', { timeout: 10000 }).click();
    cy.get('.removeHostBtn').click();
    cy.get('#noHost input:checked');
  });
});
