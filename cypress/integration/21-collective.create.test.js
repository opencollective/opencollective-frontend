const WEBSITE_URL =
  process.env.WEBSITE_URL ||
  'http://localhost:3000' ||
  'https://staging.opencollective.com';

const collectiveName = 'New collective';

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
};

const init = (skip_signin = false) => {
  if (skip_signin) {
    cy.visit(
      'http://localhost:3000/signin/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImxvZ2luIiwiaWQiOjk0NzQsImVtYWlsIjoidGVzdHVzZXIrYWRtaW5Ab3BlbmNvbGxlY3RpdmUuY29tIiwiaWF0IjoxNTE3NzgzMTkwLCJleHAiOjE1MTc4Njk1OTAsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzA2MCIsInN1YiI6OTQ3NH0.RZojXMJVzznInDr5LyVhzsO5Dcq3qzRsKooPoeJQAEQ?next=/opencollective-host/apply',
    );
  } else {
    cy.visit(`${WEBSITE_URL}/create`);
    fill('email', 'testuser@opencollective.com');
    cy.get('.LoginForm button').click();
  }
};

describe('create a collective', () => {
  it('edit info', () => {
    init();
    cy.get('.CollectiveCategoryPicker .category')
      .first()
      .click();
    fill('name', collectiveName);
    fill('description', 'short description for new collective');
    fill('website', 'https://newcollective.org');
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
    fill('organization_name', 'new org');
    fill('organization_website', 'newco.com');
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
    cy.get('.LoggedInUser .ApplyToHostBtn .Button:enabled').contains(
      'Apply to host your collective New collective',
    );
    cy.get('.LoggedInUser .ApplyToHostBtn .Button:enabled').click({
      force: true,
    });
    cy.get('.LoggedInUser .ApplyToHostBtn').contains(
      `Application pending for ${collectiveName}`,
    );
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
