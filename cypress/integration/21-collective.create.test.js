const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

const longDescription = "This is a longer description in **markdown**";

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
}

const init = (skip_signin = false) => {
  if (skip_signin) {
    cy.visit(`http://localhost:3000/signin/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImxvZ2luIiwiaWQiOjk0NzQsImVtYWlsIjoidGVzdHVzZXIrYWRtaW5Ab3BlbmNvbGxlY3RpdmUuY29tIiwiaWF0IjoxNTE3NzgzMTkwLCJleHAiOjE1MTc4Njk1OTAsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzA2MCIsInN1YiI6OTQ3NH0.RZojXMJVzznInDr5LyVhzsO5Dcq3qzRsKooPoeJQAEQ?next=/opencollective-host/apply`);
  } else {
    cy.visit(`${WEBSITE_URL}/create`);
    fill("email", "testuser+admin@opencollective.com");
    cy.get('.LoginForm button').click();
  }
}

describe("create a collective on default host", () => {

  it ("edit info", () => {
    init();
    fill("name", "New collective");
    fill("twitterHandle", "twitterHandle");
    fill("description", "short description for new collective");
    fill("website", "https://newcollective.org");
    cy.get(".inputField.longDescription textarea")
      .type(longDescription)
      .blur();
    cy.wait(300);
    cy.get('.actions button').click();
    cy.get('.error').contains("Please accept the terms of service");
    cy.get('.tos input[type="checkbox"]').click()
    cy.get('.actions button').click();
    cy.get('.result').contains("Collective created successfully");
    cy.wait(1000);
    cy.get('.CollectivePage .NotificationLine').contains("Your collective has been created with success");
    cy.get('.CollectivePage .TierCard').should("have.length", 2);
  })

})
