const collectiveTitle = 'Test Collective';
const title = `New event ${Math.round(Math.random() * 10000)}`;
const updatedTitle = `New event updated ${Math.round(Math.random() * 10000)}`;

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
    cy.get('.inputField.endsAt input').focus();
    cy.get('.rdtNext span').click;
    cy.get('.endsAt .rdtDay:not(.rdtOld):not(.rdtDisabled)').first().click();
    cy.get('.geosuggest__input').type('Superfilles');
    cy.wait(100);
    cy.get('.geosuggest__suggests > :nth-child(1)').click();
    cy.get('#location .address').contains('Lesbroussart');
    cy.get('#location .address').contains('1050');
    cy.get('.EditTiers .tier .inputField.name input').type('Free ticket');
    cy.get('.EditTiers .tier .inputField.description textarea').type('Free ticket for students');
    cy.get('.EditTiers .tier .inputField.maxQuantity input').type('10');
    cy.get('.addTier').click();
    cy.get('.EditTiers .tier').last().find('.inputField.name input').type('Paid ticket');
    cy.get('.EditTiers .tier').last().find('.inputField.amount input').type(15).blur();
    cy.get('.actions button.save').click();
    cy.get('#location .address').contains('Lesbroussart');
    cy.get('#location .address').contains('1050');
    cy.get('[data-cy=Tickets] [data-cy=contribute-card-tier]').should('have.length', 2);
    cy.get('[data-cy=Tickets] [data-cy=contribute-card-tier] [data-cy=amount]').contains(15);
    cy.get('#top').scrollIntoView();
    cy.get('a[title=Settings]').click();
    cy.get('.inputs .inputField.name input').type(`{selectall}${updatedTitle}`);
    cy.get('.EditTiers .tier:nth-child(2) .removeTier').click();
    cy.get('.actions button.save').click();
    cy.get('h1 a').click();
    cy.get('[data-cy=Tickets] [data-cy=contribute-card-tier]').should('have.length', 1);
    cy.get('h1[data-cy=collective-title]').contains(updatedTitle);
    // testing delete
    cy.get('a[title=Settings]').click();
    cy.get('.actions button.delete').click();
    cy.get('button.confirmDelete').click();
    cy.get('h1[data-cy=collective-title]').contains(collectiveTitle);
  });
});
