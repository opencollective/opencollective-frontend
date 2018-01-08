const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";
const random = Math.round(Math.random() * 100000);
const expenseDescription = `New expense ${random}`;


const signin = (redirect) => {
  cy.visit(`${WEBSITE_URL}/signin?next=${redirect}`)
  cy.get('.email.inputField input').type('testuser+admin@opencollective.com');
  cy.wait(500)
  cy.get('.email.inputField input').type('{enter}');
  cy.wait(500)
}

const addTier = () => {
  cy.get('.addTier').click();
  cy.get('.EditTiers .tier:last .name.inputField input').type("{selectall}Donor (one time donation)")
  cy.get('.EditTiers .tier:last .description.inputField textarea').type("{selectall}New description for donor")
  cy.get('.EditTiers .tier:last .amount.inputField input').type("{selectall}500")
  cy.get('.EditTiers .tier:last .interval.inputField select').select("onetime")
  cy.get('.EditTiers .tier:last .maxQuantity.inputField input').type("10")
}

describe("edit collective", () => {

  it ("edit info", () => {
    signin(`/testcollective/edit`);
    cy.get('.name.inputField input').type(' edited');
    cy.get('.description.inputField input').type(' edited');
    cy.get('.twitterHandle.inputField input').type('{selectall}opencollect');
    cy.get('.website.inputField input').type('{selectall}opencollective.com');
    cy.get('.longDescription.inputField textarea').type('{selectall}Testing *markdown* [link to google](https://google.com).');
    cy.wait(500);
    cy.get('.actions > .btn').click(); // save changes
    cy.get('.backToProfile a').click(); // back to profile
    cy.get('.cover h1').contains('edited');
    cy.get('.cover .twitterHandle').contains('@opencollect');
    cy.get('.cover .website').contains('opencollective.com');
    cy.get('.CollectivePage .longDescription').contains("Testing markdown link to google");
    cy.get('.CollectivePage .longDescription a').contains("link to google");
  })

  it.only ("edit tiers", () => {
    signin(`/testcollective/edit`);
    cy.get('.menuBtnGroup .tiers').click();
    cy.get('.EditTiers .tier:first .name.inputField input').type("{selectall}Backer edited")
    cy.get('.EditTiers .tier:first .description.inputField textarea').type("{selectall}New description for backers")
    cy.get('.EditTiers .tier:first .amount.inputField input').type("{selectall}5")
    addTier();
    cy.wait(500);
    cy.get('.actions > .btn').click(); // save changes
    cy.get('.backToProfile a').click(); // back to profile
    cy.get('.TierCard', { timeout: 5000 })
    cy.screenshot("tierEdited");
    cy.get('.TierCard').first().find('.name').contains('Backer edited');
    cy.get('.TierCard').first().find('.description').contains('New description for backers');
    cy.get('.TierCard').first().find('.amount').contains('$5');
    cy.get('.TierCard').first().find('.interval').contains('per month');
    cy.screenshot("tierAdded");
    cy.get('.CollectivePage .tiers', { timeout: 5000 }).find('.TierCard')
      .should('have.length', 3)
      .last().should('contain', 'Donor (one time donation)')
    cy.visit(`${WEBSITE_URL}/testcollective/edit#tiers`);
    cy.get('.EditTiers .tier').last().find('.removeTier').click();
    cy.get('.actions > .btn').click(); // save changes
    cy.get('.backToProfile a').click(); // back to profile
    cy.get('.CollectivePage .tiers', { timeout: 10000 }).find('.TierCard')
      .should('have.length', 2)
  })

})