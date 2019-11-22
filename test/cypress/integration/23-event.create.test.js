const collectiveTitle = 'Test Collective';
const longDescription = 'This is a longer description in **markdown**';
const title = `New event ${Math.round(Math.random() * 10000)}`;
const updatedTitle = `New event updated ${Math.round(Math.random() * 10000)}`;
let i = 0;

describe('event.create.test.js', () => {
  let collectiveSlug = null;

  before(() => {
    cy.createHostedCollective().then(({ slug }) => {
      collectiveSlug = slug;
    });
  });

  beforeEach(() => {
    cy.login({ redirect: `/${collectiveSlug}/events/create` });
  });

  it('create an event', () => {
    cy.get('.inputs .inputField.name input', { timeout: 20000 }).type(title);
    cy.get('.inputField.longDescription textarea')
      .type(longDescription)
      .blur();
    cy.get('.inputField.endsAt input').focus();
    cy.get('.rdtNext span').click;
    cy.get('.endsAt .rdtDay:not(.rdtOld):not(.rdtDisabled)')
      .first()
      .click();
    cy.wait(300);
    cy.get('.geosuggest__input').type('Superfilles');
    cy.wait(100);
    cy.get('.geosuggest__suggests > :nth-child(1)').click();
    cy.wait(100);
    cy.get('#location .address').contains('Lesbroussart');
    cy.get('#location .address').contains('1050');
    cy.get('.EditTiers .tier .inputField.name input').type('Free ticket');
    cy.get('.EditTiers .tier .inputField.description textarea').type('Free ticket for students');
    cy.get('.EditTiers .tier .inputField.maxQuantity input').type('10');
    cy.get('.addTier').click();
    cy.get('.EditTiers .tier')
      .last()
      .find('.inputField.name input')
      .type('Paid ticket');
    cy.get('.EditTiers .tier')
      .last()
      .find('.inputField.amount input')
      .type(15)
      .blur();
    cy.wait(300);
    cy.screenshot(`s${i++}`);
    cy.get('.actions button.save').click();
    cy.wait(500);
    cy.screenshot(`s${i++}`);
    cy.get('#location .address').contains('Lesbroussart');
    cy.get('#location .address').contains('1050');
    cy.get('#tickets .tier').should('have.length', 2);
    cy.wait(500);
    cy.screenshot(`s${i++}`);
    cy.get('#tickets .tier:nth-child(1) .amount').contains(15);
    cy.wait(300);
    cy.get('.desktopOnly .editCollective a').click();
    cy.wait(1000);
    cy.get('.inputs .inputField.name input', { timeout: 10000 }).type(`{selectall}${updatedTitle}`);
    cy.get('.EditTiers .tier:nth-child(2) .removeTier').click();
    cy.wait(300);
    cy.get('.actions button.save').click();
    cy.wait(500);
    cy.reload(true);
    cy.wait(500);
    cy.get('#tickets .tier').should('have.length', 1);
    cy.get('.CollectiveCover h1').contains(updatedTitle);
    cy.wait(300);
    // testing delete
    cy.get('.desktopOnly .editCollective a').click();
    cy.wait(1000);
    cy.get('.actions button.delete').click();
    cy.wait(300);
    cy.get('button.confirmDelete').click();
    cy.wait(3000);
    cy.get('h1').contains(collectiveTitle);
  });
});
