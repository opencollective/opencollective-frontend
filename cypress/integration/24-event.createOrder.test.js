describe('event.createOrder page', () => {
  it('makes an order for a free ticket as an existing user', () => {
    cy.login({ redirect: '/opensource/events/webpack-webinar' });
    cy.get('#free.tier .btn.increase').click();
    cy.get('#free.tier .ctabtn').click();
    cy.location().should(location => {
      expect(location.pathname).to.eq('/opensource/events/webpack-webinar/order/78');
      expect(location.search).to.eq('?quantity=2&totalAmount=0');
    });

    cy.contains('Next step').click();

    // Free per default
    cy.get('input[type=number][name=custom-amount]').should('have.value', '0');
    cy.get('input[type=number][name=quantity]').should('have.value', '2');
    cy.contains('.step-details', 'Free');

    // Has truncated event details
    cy.contains("Time: Oct 9 at 5PM, US Pacific time. That's 8PM Eastern.");
    cy.contains('Ask Sean questions about how to grow your com...');
    cy.contains('Show more');

    // Can submit freely
    cy.contains('Next step').click();
    cy.contains('This is a free ticket, you can submit your order directly.');

    cy.contains('Make contribution').click();
    cy.contains(
      'Test User Admin has registered for the event Webinar: How Webpack Reached $400K+/year in Sponsorship & Crowdfunding (Free)',
    );
  });

  it('makes an order for a paying ticket as an existing user', () => {
    cy.signup({ redirect: '/opensource/events/webpack-webinar' });
    cy.get('#silver-sponsor.tier .btn.increase').click();
    cy.get('#silver-sponsor.tier .ctabtn').click();
    cy.location().should(location => {
      expect(location.pathname).to.eq('/opensource/events/webpack-webinar/order/77');
      expect(location.search).to.eq('?quantity=2&totalAmount=50000');
    });

    cy.contains('Next step').click();

    cy.get('input[type=number][name=custom-amount]').should('have.value', '250');
    cy.get('input[type=number][name=quantity]').should('have.value', '2');
    cy.contains('.step-details', '$250.00 x 2');

    // Submit
    cy.contains('Next step').click();
    cy.contains('You’ll contribute with the amount of $500.00.');
    cy.wait(1000); // Wait for stripe to be loaded
    cy.fillStripeInput();
    cy.contains('button', 'Make contribution').click();

    cy.get('#page-order-success', { timeout: 20000 }).contains('$500.00');
    cy.contains(
      "You've registered for the event Webinar: How Webpack Reached $400K+/year in Sponsorship & Crowdfunding (Silver Sponsor)",
    );
  });

  /**
   * This test is not used anymore as we've moved to the new contribution flow.
   * It will be removed soon.
   */
  it.skip('makes an order as new user', () => {
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
