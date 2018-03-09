const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";

const longDescription = "This is a longer description in **markdown**";

const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
}

const init = (skip_signin = false) => {
  if (skip_signin) {
    cy.visit(`http://localhost:3000/signin/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImxvZ2luIiwiaWQiOjk0NzQsImVtYWlsIjoidGVzdHVzZXIrYWRtaW5Ab3BlbmNvbGxlY3RpdmUuY29tIiwiaWF0IjoxNTE5MjQ3NTQ0LCJleHAiOjE1MTkzMzM5NDQsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzA2MCIsInN1YiI6OTQ3NH0.Teba08Y19C5Oz0a4b64PBZv8A_H_Fl_hSr4CR6lU5-U?next=/testcollective/events/new`);
  } else {
    cy.visit(`${WEBSITE_URL}/signin?next=/testcollective`);
    fill("email", "testuser+admin@opencollective.com");
    cy.get('.LoginForm button').click();
    cy.get('#events .action').click();
  }
}

const title = `New event ${Math.round(Math.random()*10000)}`;
const updatedTitle = `New event updated ${Math.round(Math.random()*10000)}`;

describe("event.create.test.js", () => {

  it ("create an event", () => {
    init();
    cy.get(".inputs .inputField.name input").type(title);
    cy.get(".inputField.longDescription textarea")
      .type(longDescription)
      .blur();
    cy.get('.inputField.endsAt input').focus();
    cy.get('.rdtNext span').click;
    cy.get('.endsAt .rdtDay:not(.rdtOld):not(.rdtDisabled)').first().click();
    cy.wait(300);
    cy.get(".geosuggest__input").type("Superfilles");
    cy.wait(100);
    cy.get(".geosuggest__suggests > :nth-child(1)").click();
    cy.wait(100);
    cy.get("#location .address").contains("Rue Lesbroussart 22, 1050"); // TODO: removed "Bruxelles, Belgium" because Google is returning a different spelling for Brussells.
    cy.get(".EditTiers .tier .inputField.name input").type("Free ticket");
    cy.get(".EditTiers .tier .inputField.description textarea").type("Free ticket for students");
    cy.get(".EditTiers .tier .inputField.maxQuantity input").type("10");
    cy.get(".addTier").click();
    cy.get(".EditTiers .tier").last().find(".inputField.name input").type("Paid ticket");
    cy.get(".EditTiers .tier").last().find(".inputField.amount input").type(15);
    cy.get(".EditTiers .tier").last().find(".inputField.amount input").blur();
    cy.wait(300);
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.get("#location .address").contains("Rue Lesbroussart 22, 1050 Bruxelles, Belgium");
    cy.get('#tickets .tier').should("have.length", 2);
    cy.get('#tickets .tier:nth-child(1) .amount').contains(15);
    cy.wait(300);
    cy.get(".desktopOnly .editCollective a").click();
    cy.wait(500);
    cy.get(".inputs .inputField.name input", { timeout: 10000 }).type(`{selectall}${updatedTitle}`);
    cy.get(".EditTiers .tier:nth-child(2) .removeTier").click();
    cy.wait(300);
    cy.get('.actions button').click();
    cy.wait(1000);
    cy.reload(true);
    cy.get('#tickets .tier').should("have.length", 1);
    cy.get('.CollectiveCover h1').contains(updatedTitle);
  })

})