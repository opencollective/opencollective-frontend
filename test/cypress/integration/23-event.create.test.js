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
    cy.get('input[name="name"]', { timeout: 20000 }).type(title);
    cy.get('input[name="endsAt"]').type('2050-01-20T13:00');
    cy.get('input[name="description"]').type('We are going to the Eiffel Tower');
    cy.get('.geosuggest__input').type('Eiffel Tower');
    cy.contains('.geosuggest__suggests > :nth-child(1)', 'Gustave').click();
    cy.get('#location [data-cy="location-address"]').contains('Gustave');
    cy.get('#location [data-cy="location-address"]').contains('Eiffel');
    cy.get('#location [data-cy="location-address"]').contains('75007');
    cy.get('#location [data-cy="location-address"]').contains('Paris');
    cy.get('#location [data-cy="location-address"]').contains('FR');
    cy.contains('button', 'Create Event').click();
    cy.getByDataCy('notification-bar').contains('Your Event has been created');
    cy.get('#location .address').contains('Paris'); // The collective page is still using the legacy Location component
    cy.get('#location .address').contains('75007');

    // Go to "Edit Tickets"
    cy.get('[data-cy="go-to-dashboard-btn"]').click();
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
    cy.get('[data-cy="go-to-dashboard-btn"]').click();
    cy.get('[data-cy="menu-item-Settings"]:visible').click();
    cy.get('[data-cy="menu-item-info"]:visible').click();

    // edit event info
    cy.get('input[name="name"]').type(`{selectall}${updatedTitle}`);
    cy.get('[data-cy="save"]', { timeout: 10000 }).should('be.enabled');
    cy.get('[data-cy="save"]').click();
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
    cy.getByDataCy('public-profile-link', { timeout: 10000 }).should('be.visible');
    // verify update
    cy.getByDataCy('public-profile-link').click();
    cy.get('[data-cy=Tickets] [data-cy=contribute-card-tier]', { timeout: 10000 }).should('have.length', 1);
    cy.get('[data-cy="financial-contributions"] [data-cy=contribute-card-tier]').should('have.length', 1);
    cy.get('h1[data-cy=collective-title]').contains(updatedTitle);
    // delete event tiers
    cy.get('[data-cy="go-to-dashboard-btn"]').click();
    cy.getByDataCy('menu-item-Settings').click();
    cy.getByDataCy('menu-item-advanced').should('be.visible').click();
    cy.contains('button', 'Delete this Event').click();
    cy.get('[data-cy=delete]').click();
    cy.location('search', { timeout: 10000 }).should('eq', '?type=EVENT');
    cy.location().should(location => {
      expect(location.search).to.eq('?type=EVENT');
    });
    cy.contains('h1', 'Your event has been deleted.');
  });
});
