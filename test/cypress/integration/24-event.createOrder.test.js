describe('event.createOrder page', () => {
  let collectiveSlug = null;

  before(() => {
    cy.createHostedCollective().then(({ slug }) => {
      collectiveSlug = slug;
    });
  });

  beforeEach(() => {
    cy.login({ redirect: `/${collectiveSlug}/events/create` });
  });

  it('makes an order for tickets with VAT', () => {
    // Activate VAT for collective
    cy.visit(`${collectiveSlug}/edit`);
    cy.contains('[data-cy="country-select"]', 'Please select your country').click();
    cy.contains('[data-cy="select-option"]', 'Belgium - BE').click();
    cy.get('select[name="VAT"]').select('OWN');
    cy.contains('button', 'Save').click();
    cy.contains('Saved');

    // Create event
    cy.visit(`${collectiveSlug}/events/new`);
    cy.get('.inputs input[name="name"]').type('Test Event with VAT');
    cy.get('.inputs .startsAt input[type="text"]')
      .clear()
      .type(`${Cypress.moment().format('MM/DD/YYYY')} 7:00 PM`)
      .blur();
    cy.get('.inputs .endsAt input[type="text"]')
      .clear()
      .type(`${Cypress.moment().add(1, 'day').format('MM/DD/YYYY')} 7:00 PM`)
      .blur();

    cy.contains('button', 'Create Event').click();
    cy.contains('a', 'Create Ticket').click();
    cy.get('.addTier').click();

    // Create tickets
    cy.get('.EditTiers input[name="name"]').type('Ticket with VAT');
    cy.get('.EditTiers input[name="amount"]').type('10');
    cy.contains('button', 'Save').click();
    cy.contains('a', 'view event page').click();

    // Go to the contribution flow
    cy.contains('button', 'Get tickets').click();

    cy.get('input[type=number][name=quantity]').type('{selectall}8');
    cy.getByDataCy('cf-next-step').click();

    // Skip the step profile on the new contribution flow
    cy.getByDataCy('cf-next-step').click();

    // Check step summary
    const breakdownLineSelector = '[data-cy="breakdown-line"]';
    cy.contains(breakdownLineSelector, 'Item price').contains('$10.00');
    cy.contains(breakdownLineSelector, 'Quantity').contains('8');
    cy.contains(breakdownLineSelector, 'Your contribution').contains('$80.00');
    cy.wait(1000);

    // Algeria should not have taxes
    cy.contains('[data-cy="country-select"]', 'Please select your country').click();
    cy.contains('[data-cy="select-option"]', 'Algeria').click();
    cy.contains(breakdownLineSelector, 'VAT').contains('+ $0.00');
    cy.contains(breakdownLineSelector, 'TOTAL').contains('$80.00');
    cy.get('button[data-cy="cf-next-step"]').should('not.be.disabled');

    // French should have taxes
    cy.get('[data-cy="country-select"]').click();
    cy.contains('[data-cy="select-option"]', 'France - FR').click();
    cy.contains(breakdownLineSelector, 'VAT').contains('+ $16.80');
    cy.contains(breakdownLineSelector, 'TOTAL').contains('$96.80');
    cy.get('button[data-cy="cf-next-step"]').should('not.be.disabled');

    // ...except if they can provide a valid VAT number
    cy.contains('div', 'Enter VAT number (if you have one)').click();

    // Can't submit while form is active
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Invalid VAT number');
    cy.getByDataCy('remove-vat-btn').click();
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Choose your payment method');
    cy.get('button[data-cy="cf-prev-step"]').click();

    // Must provide a valid VAT number
    cy.contains('div', 'Enter VAT number (if you have one)').click();
    cy.get('input[name=taxIndentificationNumber]').type('424242');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Invalid VAT number');
    cy.get('input[name=taxIndentificationNumber]').type('{selectall}FR-XX999999999');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Choose your payment method');
    cy.get('button[data-cy="cf-prev-step"]').click();

    // Values should be updated
    cy.get('button[data-cy="cf-next-step"]').should('not.be.disabled');
    cy.contains('FRXX999999999'); // Number is properly formatted
    cy.contains(breakdownLineSelector, 'VAT').contains('+ $0.00');
    cy.contains(breakdownLineSelector, 'TOTAL').contains('$80.00');

    // User can update the number
    cy.contains('div', 'Change VAT number').click();
    cy.get('input[name=taxIndentificationNumber]').should('have.value', 'FRXX999999999');
    cy.get('input[name=taxIndentificationNumber]').type('{selectall}FR-XX-999999998');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Choose your payment method');
    cy.get('button[data-cy="cf-prev-step"]').click();
    cy.contains('FRXX999999998'); // Number is properly formatted

    // However if it's the same country than the collective than VAT should still apply,
    // even if the contributor is an organization
    cy.get('[data-cy="country-select"]').click();
    cy.contains('[data-cy="select-option"]', 'Belgium - BE').click();
    cy.contains(breakdownLineSelector, 'VAT').contains('+ $16.80');
    cy.contains(breakdownLineSelector, 'TOTAL').contains('$96.80');
    cy.contains('div', 'Enter VAT number (if you have one)').click();
    cy.get('input[name=taxIndentificationNumber]').type('FRXX999999998');
    cy.get('button[data-cy="cf-next-step"]').click();
    // Tried to use a french VAT number with Belgium
    cy.contains("The VAT number doesn't match the country");
    cy.get('input[name=taxIndentificationNumber]').type('{selectall}BE-0414445663');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Choose your payment method');
    cy.get('button[data-cy="cf-prev-step"]').click();
    cy.contains('BE0414445663'); // Number is properly formatted
    cy.contains(breakdownLineSelector, 'VAT').contains('+ $16.80');
    cy.contains(breakdownLineSelector, 'TOTAL').contains('$96.80');

    // Let's submit this order!
    cy.getByDataCy('cf-next-step').click();
    cy.useAnyPaymentMethod();
    cy.wait(500);
    cy.contains('button', 'Contribute $96.80').click();
    cy.wait(500);
    cy.getByDataCy('order-success', { timeout: 20000 });
  });

  describe.skip('Outdated', () => {
    // This needs to be converted to the new Page
    it.skip("can't order if the event is over", () => {
      cy.visit('/opensource/events/webpack-webinar/legacy');
      cy.contains('Webinar: How Webpack Reached $400K+/year in Sponsorship & Crowdfunding');
      cy.get('.cover .cta').should('not.exist');
      cy.get('#tickets').should('not.exist');
    });

    // This needs to be converted to the new Page
    it.skip('makes an order for a free ticket as an existing user', () => {
      cy.clock(Date.parse('2017/10/01')); // Go back in time when the event was not over yet
      cy.login({ redirect: '/opensource/events/webpack-webinar/legacy' });
      cy.get('#free.tier .btn.increase').click();
      cy.get('#free.tier .ctabtn').click();
      cy.location({ timeout: 15000 }).should(location => {
        expect(location.pathname).to.eq('/opensource/events/webpack-webinar/order/78');
        expect(location.search).to.eq('?quantity=2');
      });

      cy.get('button[data-cy="cf-next-step"]').click();

      // Free per default
      cy.get('input[type=number][name=custom-amount]').should('have.value', '0');
      cy.get('input[type=number][name=quantity]').should('have.value', '2');
      cy.contains('[data-cy="progress-step-details"]', 'Free');

      // Has truncated event details
      cy.contains("Time: Oct 9 at 5PM, US Pacific time. That's 8PM Eastern.");
      cy.contains('Ask Sean questions about how to grow your com...');
      cy.contains('Show more');

      // Can submit freely
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.contains('This is a free ticket, you can submit your order directly.');

      cy.contains('button', 'Make contribution').click();
      cy.contains(
        'Test User Admin has registered for the event Webinar: How Webpack Reached $400K+/year in Sponsorship & Crowdfunding (Free)',
      );
    });

    // This needs to be converted to the new Page
    it.skip('makes an order for a paying ticket as an existing user', () => {
      cy.clock(Date.parse('2017/10/01')); // Go back in time when the event was not over yet
      cy.signup({ redirect: '/opensource/events/webpack-webinar/legacy' });
      cy.get('#silver-sponsor.tier .btn.increase').click();
      cy.get('#silver-sponsor.tier .ctabtn').click();
      cy.location({ timeout: 15000 }).should(location => {
        expect(location.pathname).to.eq('/opensource/events/webpack-webinar/order/77');
        expect(location.search).to.eq('?quantity=2');
      });

      cy.get('button[data-cy="cf-next-step"]').click();

      cy.get('input[type=number][name=custom-amount]').should('have.value', '250');
      cy.get('input[type=number][name=quantity]').should('have.value', '2');
      cy.contains('[data-cy="progress-step-details"]', '$250.00 x 2');

      // Submit
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.contains('You’ll contribute with the amount of $500.00.');
      cy.wait(1000); // Wait for stripe to be loaded
      cy.fillStripeInput();
      cy.contains('button', 'Contribute').click();

      cy.getByDataCy('order-success', { timeout: 20000 }).contains('$500.00');
      cy.contains(
        "You've registered for the event Webinar: How Webpack Reached $400K+/year in Sponsorship & Crowdfunding (Silver Sponsor)",
      );
    });
  });
});
