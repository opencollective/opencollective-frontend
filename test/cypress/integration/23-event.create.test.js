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
    cy.get('.inputField.endsAt input').type('2050-01-20T13:00');
    cy.get('.geosuggest__input').type('Eiffel Tower');
    cy.contains('.geosuggest__suggests > :nth-child(1)', 'Gustave').click();
    cy.get('#location .address').contains('Gustave');
    cy.get('#location .address').contains('Eiffel');
    cy.get('#location .address').contains('75007');
    cy.get('#location .address').contains('Paris');
    cy.get('#location .address').contains('FR');
    cy.contains('button', 'Create Event').click();
    cy.getByDataCy('notification-bar').contains('Your Event has been created');
    cy.get('#location .address').contains('Paris');
    cy.get('#location .address').contains('75007');

    // Go to "Edit Tickets"
    cy.get('[data-cy=edit-collective-btn]:first').click();
    cy.getByDataCy('menu-item-tickets').click();
    cy.getByDataCy('create-ticket').click();
    cy.get('[data-cy=name]').type('Free ticket');
    cy.get('[data-cy=description]').type('Free ticket for students');
    cy.get('input[data-cy=amount]').type('0');
    cy.get('input[data-cy=maxQuantity]').type('10');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ variant: 'success', message: 'Ticket created.' });

    // Create another ticket
    cy.getByDataCy('create-ticket').click();
    cy.get('[data-cy=name]').type('Paid ticket');
    cy.get('input[data-cy=amount]').type('15');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ variant: 'success', message: 'Ticket created.' });
    cy.getByDataCy('public-profile-link').click();

    // Check collective page
    cy.get('[data-cy=Tickets] [data-cy=contribute-card-tier]').should('have.length', 2);
    cy.get('[data-cy=Tickets] [data-cy=contribute-card-tier] [data-cy=amount]').contains(15);
    cy.get('#top').scrollIntoView();
    cy.get('[data-cy="edit-collective-btn"]:visible').click();
    cy.get('[data-cy="menu-item-Settings"]:visible').click();

    // edit event info
    cy.get('.inputs .inputField.name input').type(`{selectall}${updatedTitle}`);
    cy.wait(400);
    cy.get('[data-cy="collective-save"]').click();
    cy.get('[data-cy="collective-save"]').contains('Saved');
    // edit event tickets
    cy.getByDataCy('menu-item-tickets').click();
    cy.getByDataCy('contribute-card-tier').last().find('button').click();
    cy.getByDataCy('delete-btn').click();
    cy.getByDataCy('confirm-delete-btn').click();
    cy.checkToast({ variant: 'success', message: 'Ticket deleted.' });
    // edit event tiers
    cy.getByDataCy('menu-item-tiers').click();
    cy.getByDataCy('create-contribute-tier').click();
    cy.get('[data-cy=name]').type('Sponsor');
    cy.get('[data-cy=description]').type('Become a sponsor');
    cy.get('input[data-cy=amount]').type('200');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ variant: 'success', message: 'Tier created.' });
    cy.wait(2000);
    // verify update
    cy.getByDataCy('public-profile-link').click();
    cy.get('[data-cy=Tickets] [data-cy=contribute-card-tier]').should('have.length', 1);
    cy.wait(100);
    cy.get('[data-cy="financial-contributions"] [data-cy=contribute-card-tier]').should('have.length', 1);
    cy.get('h1[data-cy=collective-title]').contains(updatedTitle);
    // delete event tiers
    cy.get('[data-cy="edit-collective-btn"]:visible').click();
    cy.getByDataCy('menu-item-Settings').click();
    cy.getByDataCy('menu-item-advanced').click();
    cy.contains('button', 'Delete this Event').click();
    cy.get('[data-cy=delete]').click();
    cy.wait(1000);
    cy.location().should(location => {
      expect(location.search).to.eq('?type=EVENT');
    });
    cy.contains('h1', 'Your event has been deleted.');
  });
});
