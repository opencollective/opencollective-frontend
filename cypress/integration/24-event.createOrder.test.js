describe('event.createOrder page', () => {
  it('makes an order as new user', () => {
    cy.visit('/opensource/events/webpack-webinar');
    cy.get('#free.tier .btn.increase').click();
    cy.get('#free.tier .ctabtn').click();
    cy.location().should(location => {
      expect(location.pathname).to.eq('/opensource/events/webpack-webinar/order/78');
      expect(location.search).to.eq('?quantity=2&totalAmount=0');
    });
    cy.wait(500);
    cy.get('.order');
    cy.fillInputField('email', 'newuser@opencollective.com');
    cy.fillInputField('firstName', 'New');
    cy.fillInputField('lastName', 'User');
    cy.fillInputField('website', 'http://mywebsite.com');
    cy.fillInputField('twitterHandle', 'twhandle');
    cy.get('.inputField.publicMessage textarea').type('excited to meet the community!');
    cy.wait(400);
    cy.get('.actions .submit button').click();
    cy.wait(400);
    cy.get('.UserCollectivePage', { timeout: 10000 });
    cy.get('.OrderCreated').contains('Thank you for your RSVP! See you soon!');
    cy.get('.OrderCreated').contains('/opensource/events/webpack-webinar');
    cy.location().should(location => {
      expect(location.search).to.match(
        /\?status=PAID&CollectiveId=[0-9]+&collectiveType=EVENT&OrderId=[0-9]+&TierId=[0-9]+&totalAmount=0/,
      );
    });
  });
});
