const WEBSITE_URL =
  process.env.WEBSITE_URL ||
  'http://localhost:3000' ||
  'https://staging.opencollective.com';

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
};

const init = (skip_signin = false) => {
  if (skip_signin) {
    cy.visit(
      'http://localhost:3000/signin/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImxvZ2luIiwiaWQiOjk0NzQsImVtYWlsIjoidGVzdHVzZXIrYWRtaW5Ab3BlbmNvbGxlY3RpdmUuY29tIiwiaWF0IjoxNTE1NDA5ODkxLCJleHAiOjE1MTgwMDE4OTEsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzA2MCIsInN1YiI6OTQ3NH0.FdisGSpfUyCgVJaWnnV5hp_IhRfO4_27kDc6DcCwqcI?next=/brusselstogetherasbl/apply',
    );
  } else {
    cy.visit(`${WEBSITE_URL}/brusselstogetherasbl`);
    cy.get('#hosting h1').contains('We are hosting 2 collectives');
    cy.get('.CollectiveCover button')
      .contains('Apply to create a collective')
      .click({ force: true });
    cy.wait(500);
    fill('email', 'testuser@opencollective.com');
    cy.get('.LoginForm button').click();
  }
};

describe('apply to host', () => {
  it('as a new collective', () => {
    init(false);
    fill('name', 'New collective');
    fill('description', 'short description for new collective');
    fill('website', 'https://xdamman.com');
    cy.get('.tos input[type="checkbox"]').click({ force: true });
    cy.wait(300);
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.get('.CollectivePage .CollectiveCover h1', { timeout: 10000 }).contains(
      'New collective',
    );
    cy.get('.CollectivePage .CollectiveCover .website').contains('xdamman.com');
    cy.get('.NotificationBar h1').contains('success');
    cy.get('.NotificationBar p').contains('BrusselsTogether ASBL');
    cy.url().then(currentUrl => {
      const CollectiveId = currentUrl.match(/CollectiveId=([0-9]+)/)[1];
      return cy.visit(
        `${WEBSITE_URL}/brusselstogetherasbl/collectives/${CollectiveId}/approve`,
      );
    });
    cy.get('.error .message').contains(
      'You need to be logged in as an admin of the host of this collective to approve it',
    );
  });
});
