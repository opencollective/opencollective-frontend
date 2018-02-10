const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
}

const init = (skip_signin = false) => {
  if (skip_signin) {
    cy.visit(`http://localhost:3000/signin/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImxvZ2luIiwiaWQiOjk0NzQsImVtYWlsIjoidGVzdHVzZXIrYWRtaW5Ab3BlbmNvbGxlY3RpdmUuY29tIiwiaWF0IjoxNTE3OTI1MTU3LCJleHAiOjE1MTgwMTE1NTcsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzA2MCIsInN1YiI6OTQ3NH0.conr19Fing0R_4HF5msk8xYedW06beY4YpDlPIy0AMY?next=/testcollective/updates/new`);
  } else {
    cy.visit(`${WEBSITE_URL}/signin?next=/testcollective/updates/new`);
    fill("email", "testuser+admin@opencollective.com");
    cy.get('.LoginForm button').click();
  }
}

describe("create an update", () => {

  it ("edit info", () => {
    init();
    cy.wait(1000);
    fill("title", "New update");
    cy.get(".ql-editor").type("This is some bold HTML{selectall}");
    cy.get(".ql-bold").click();
    cy.wait(300);
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.get('.UpdatePage .title', { timeout: 10000 }).contains(`New update`);
    cy.get('.UpdatePage .meta').contains(`draft`);
    cy.get('.UpdatePage .PublishUpdateBtn').contains(`Your update will be sent to`);
    cy.get('.UpdatePage button.publish').click();
    cy.get('.UpdatePage .meta').contains(`draft`).should('not.exist');
  })

})