const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

const longDescription = "This is a longer description in **markdown**";

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
}

const init = (skip_signin = false) => {
  if (skip_signin) {
    cy.visit(`http://localhost:3000/signin/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImxvZ2luIiwiaWQiOjk0NzQsImVtYWlsIjoidGVzdHVzZXIrYWRtaW5Ab3BlbmNvbGxlY3RpdmUuY29tIiwiaWF0IjoxNTE1NDA5ODkxLCJleHAiOjE1MTgwMDE4OTEsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzA2MCIsInN1YiI6OTQ3NH0.FdisGSpfUyCgVJaWnnV5hp_IhRfO4_27kDc6DcCwqcI?next=/organizations/new`);
  } else {
    cy.visit(`${WEBSITE_URL}/organizations/new`);
    fill("email", "testuser+admin@opencollective.com");
    cy.get('.LoginForm button').click();
  }
}

describe("create an organization", () => {

  it ("edit info", () => {
    init();
    fill("name", "New org");
    fill("twitterHandle", "twitterHandle");
    fill("description", "short description for new org");
    fill("website", "https://newco.com");
    cy.get(".inputField.longDescription textarea")
      .type(longDescription)
      .blur();
    cy.wait(300);
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.get('.UserCollectivePage .CollectiveCover h1', { timeout: 10000 }).contains(`New org`);
    cy.get('.UserCollectivePage .CollectiveCover .twitterHandle').contains(`@twitterHandle`);
    cy.get('.UserCollectivePage .CollectiveCover .website').contains(`newco.com`);
    cy.get('.UserCollectivePage .longDescription').contains(longDescription.replace(/\*/g, ""));
    cy.get('.NotificationBar h1').contains("success");
  })

})