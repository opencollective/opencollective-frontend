const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000" || "https://staging.opencollective.com";
const random = Math.round(Math.random() * 100000);
const expenseDescription = `New expense ${random}`;


const signin = (redirect) => {
  cy.visit(`${WEBSITE_URL}/signin?next=${redirect}`)
  cy.get('.email.inputField input').type('testuser+admin@opencollective.com');
  cy.wait(400)
  cy.get('.email.inputField input').type('{enter}');
  cy.wait(700)
}

const addTier = (tier) => {
  cy.get('.addTier').click();

  const fields = [
    { type: 'input', name: 'name' },
    { type: 'textarea', name: 'description' },
    { type: 'input', name: 'maxQuantity' },
    { type: 'input', name: 'amount' },
    { type: 'select', name: 'interval' },
  ];

  fields.map(field => {
    const action = field.type === 'select' ? 'select' : 'type';
    const value = action === 'type' ? `{selectall}${tier[field.name]}` : tier[field.name];
    cy.get(`.EditTiers .tier:last .${field.name}.inputField ${field.type}`)[action](value);
  })
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
    cy.wait(500);
    cy.get('.CollectivePage .cover h1').contains('edited');
    cy.get('.cover .twitterHandle').contains('@opencollect');
    cy.get('.cover .website').contains('opencollective.com');
    cy.get('.CollectivePage .longDescription').contains("Testing markdown link to google");
    cy.get('.CollectivePage .longDescription a').contains("link to google");
  })

  it ("edit tiers", () => {
    signin(`/testcollective/edit`);
    cy.get('.menuBtnGroup .tiers').click();
    cy.get('.EditTiers .tier:first .name.inputField input').type("{selectall}Backer edited")
    cy.get('.EditTiers .tier:first .description.inputField textarea').type("{selectall}New description for backers")
    cy.get('.EditTiers .tier:first .amount.inputField input').type("{selectall}5")
    cy.get('.EditTiers .tier:first ._amountType.inputField select').select("flexible");
    cy.get('.EditTiers .tier:first .currency1.inputField input').type("{selectall}5");
    cy.get('.EditTiers .tier:first .currency2.inputField input').type("{selectall}10");
    cy.get('.EditTiers .tier:first .currency3.inputField input').type("{selectall}20");
    cy.get('.EditTiers .tier:first .currency0.inputField input').type("{selectall}{backspace}");
    addTier({
      name: "Donor (one time donation)",
      type: "DONATION",
      amount: 500,
      interval: "onetime",
      description: "New description for donor"
    });
    addTier({
      type: "SERVICE",
      name: "Priority Support",
      description: "Get priority support from the core contributors",
      amount: 1000,
      interval: "month",
      maxQuantity: 10
    })
    cy.wait(500);
    cy.get('.actions > .btn').click(); // save changes
    cy.get('.backToProfile a').click(); // back to profile
    cy.wait(500);
    cy.get('.TierCard', { timeout: 5000 })
    cy.screenshot("tierEdited");
    cy.get('.TierCard').first().find('.name').contains('Backer edited');
    cy.get('.TierCard').first().find('.description').contains('New description for backers');
    cy.get('.TierCard').first().find('.amount').contains('$5+');
    cy.get('.TierCard').first().find('.interval').contains('per month');
    cy.screenshot("tierAdded");
    cy.get('.CollectivePage .tiers', { timeout: 5000 }).find('.TierCard')
      .should('have.length', 4)
      .last().should('contain', 'Priority Support')
    cy.get('.CollectivePage .tiers').find('.TierCard').first().find('a.action').click();
    cy.get('.OrderForm', { timeout: 20000 })
    cy.get('.tier .selectPreset label').contains("Select monthly amount")
    cy.get('.tier .presetBtn', { timeout: 5000 })
      .should('have.length', 3)
    cy.visit(`${WEBSITE_URL}/testcollective/edit#tiers`);
    cy.get('.EditTiers .tier').first().find('._amountType select').select("fixed");
    cy.get('.EditTiers .tier').last().find('.removeTier').click();
    cy.get('.EditTiers .tier').last().find('.removeTier').click();
    cy.wait(500)
    cy.get('.actions > .btn').click(); // save changes
    cy.get('.backToProfile a').click(); // back to profile
    cy.wait(500)
    cy.get('.CollectivePage .tiers', { timeout: 10000 }).find('.TierCard')
      .should('have.length', 2)
  })

})