import dayjs from 'dayjs';

describe('event.createOrder page', () => {
  let collective = null;

  const createEvent = name => {
    // Create event
    cy.visit(`${collective.slug}/events/new`);
    cy.get('.inputs input[name="name"]').type(name);
    cy.get('.inputs .startsAt input[type="datetime-local"]')
      .clear()
      .type(`${dayjs().format('YYYY-MM-DD')}T19:00`)
      .blur();
    cy.get('.inputs .endsAt input[type="datetime-local"]')
      .clear()
      .type(`${dayjs().add(1, 'day').format('YYYY-MM-DD')}T19:00`)
      .blur();
    cy.contains('button', 'Create Event').click();
  };

  before(() => {
    cy.createHostedCollective().then(c => (collective = c));
  });

  beforeEach(() => {
    cy.login({ redirect: `/${collective.slug}/events/create` });
  });

  it('makes an order for a free ticket', () => {
    createEvent('Free Ticket Event');

    // Create Ticket
    cy.contains('a', 'Create Ticket').click();
    cy.get('[data-cy="admin-panel-container"] [data-cy="create-ticket"]').click();
    cy.get('[data-cy=name]').type('Free ticket');
    cy.get('input[data-cy=amount]').type('0');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ type: 'SUCCESS', message: 'Ticket created.' });
    cy.getByDataCy('menu-account-avatar-link').click();

    // Go to the contribution flow
    cy.contains('button', 'RSVP').click();

    cy.get('[data-cy="amount-picker"]').should('not.exist');
    cy.get('[data-cy="contribution-quantity"]').should('exist');

    cy.getByDataCy('cf-next-step').click();
    cy.getByDataCy('cf-next-step').contains('Get ticket').click();

    cy.wait(500);
    cy.getByDataCy('order-success', { timeout: 20000 });
  });

  it('makes an order for a paying ticket with fixed amount', () => {
    createEvent('Paying Ticket Event');

    // Create Ticket
    cy.contains('a', 'Create Ticket').click();
    cy.get('[data-cy="admin-panel-container"] [data-cy="create-ticket"]').click();
    cy.get('[data-cy=name]').type('Paying Ticket');
    cy.get('input[data-cy=amount]').type('10');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ type: 'SUCCESS', message: 'Ticket created.' });
    cy.getByDataCy('menu-account-avatar-link').click();

    // Go to the contribution flow
    cy.contains('button', 'RSVP').click();

    cy.get('[data-cy="amount-picker"]').should('not.exist');
    cy.get('[data-cy="contribution-quantity"]').should('exist');

    cy.getByDataCy('cf-next-step').click();

    // Skip the step profile on the new contribution flow
    cy.getByDataCy('cf-next-step').click();

    cy.useAnyPaymentMethod();
    cy.wait(500);
    cy.contains('button', 'Get ticket').click();
    cy.wait(500);
    cy.getByDataCy('order-success', { timeout: 20000 });
  });

  it('makes an order for a paying ticket with flexible amount', () => {
    createEvent('Flexible Paying Ticket Event');

    // Create Ticket
    cy.contains('a', 'Create Ticket').click();
    cy.get('[data-cy="admin-panel-container"] [data-cy="create-ticket"]').click();
    cy.get('[data-cy=name]').type('Flexible Paying Ticket');
    cy.get('[data-cy=amountType]').click();
    cy.contains('[data-cy=select-option]', 'Flexible').click();
    cy.get('input[data-cy=amount]').type('10');
    cy.get('input[data-cy=minimumAmount]').type('5');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ type: 'SUCCESS', message: 'Ticket created.' });
    cy.getByDataCy('menu-account-avatar-link').click();

    // Go to the contribution flow
    cy.contains('button', 'RSVP').click();

    cy.get('[data-cy="amount-picker"]').should('exist');
    cy.get('[data-cy="contribution-quantity"]').should('exist');

    cy.getByDataCy('cf-next-step').click();

    // Skip the step profile on the new contribution flow
    cy.getByDataCy('cf-next-step').click();

    cy.useAnyPaymentMethod();
    cy.wait(500);
    cy.contains('button', 'Get ticket').click();
    cy.wait(500);
    cy.getByDataCy('order-success', { timeout: 20000 });
  });

  it('makes an order for tickets with VAT', () => {
    // Activate VAT for collective
    cy.editCollective({
      id: collective.id,
      location: { country: 'BE' },
      settings: { VAT: { type: 'OWN', number: 'FRXX999999999' } },
    });

    // Create event
    createEvent('Test Event with VAT');

    cy.contains('a', 'Create Ticket').click();

    // Create tickets
    cy.get('[data-cy="admin-panel-container"] [data-cy="create-ticket"]').click();
    cy.get('[data-cy=name]').type('Ticket with VAT');
    cy.get('input[data-cy=amount]').type('10');
    cy.getByDataCy('confirm-btn').click();
    cy.checkToast({ type: 'SUCCESS', message: 'Ticket created.' });
    cy.getByDataCy('menu-account-avatar-link').click();

    // Go to the contribution flow
    cy.contains('button', 'RSVP').click();

    cy.get('input[type=number][name=quantity]').type('{selectall}8');
    cy.getByDataCy('cf-next-step').click();

    // Skip the step profile on the new contribution flow
    cy.getByDataCy('cf-next-step').click();

    // Check step summary
    const breakdownLineSelector = '[data-cy="ContributionSummary-AmountLine"]';
    cy.contains(breakdownLineSelector, 'Contribution to Test Event with VAT - "Ticket with VAT"').contains('$10.00');
    cy.contains(breakdownLineSelector, 'Quantity').contains('8');
    cy.contains(breakdownLineSelector, "Today's charge").contains('$80.00');
    cy.wait(1000);

    // Algeria should not have taxes
    cy.contains('[data-cy="country-select"]', 'Please select your country').click();
    cy.contains('[data-cy="select-option"]', 'Algeria').click();
    cy.getByDataCy('VAT-amount').contains('$0.00');
    cy.contains(breakdownLineSelector, "Today's charge").contains('$80.00');
    cy.get('button[data-cy="cf-next-step"]').should('not.be.disabled');

    // French should have taxes
    cy.get('[data-cy="country-select"]').click();
    cy.contains('[data-cy="select-option"]', 'France').click();
    cy.getByDataCy('VAT-amount').contains('$16.80');
    cy.contains(breakdownLineSelector, "Today's charge").contains('$96.80');
    cy.get('button[data-cy="cf-next-step"]').should('not.be.disabled');

    // ...except if they can provide a valid VAT number
    cy.contains('div', 'Enter VAT number (if you have one)').click();

    // Can't submit while form is active
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Invalid VAT number');
    cy.getByDataCy('remove-vat-btn').click();
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Choose payment method');
    cy.get('button[data-cy="cf-prev-step"]').click();

    // Must provide a valid VAT number
    cy.contains('div', 'Enter VAT number (if you have one)').click();
    cy.get('input[name=taxIdNumber]').type('424242');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Invalid VAT number');
    cy.get('input[name=taxIdNumber]').type('{selectall}FR-XX999999999');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Choose payment method');
    cy.get('button[data-cy="cf-prev-step"]').click();

    // Values should be updated
    cy.get('button[data-cy="cf-next-step"]').should('not.be.disabled');
    cy.contains('FRXX999999999'); // Number is properly formatted
    cy.getByDataCy('VAT-amount').contains('$0.00');
    cy.contains(breakdownLineSelector, "Today's charge").contains('80.00');

    // User can update the number
    cy.contains('div', 'Change VAT number').click();
    cy.get('input[name=taxIdNumber]').should('have.value', 'FRXX999999999');
    cy.get('input[name=taxIdNumber]').type('{selectall}FR-XX-999999998');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Choose payment method');
    cy.get('button[data-cy="cf-prev-step"]').click();
    cy.contains('FRXX999999998'); // Number is properly formatted

    // However if it's the same country than the collective than VAT should still apply,
    // even if the contributor is an organization
    cy.get('[data-cy="country-select"]').click();
    cy.contains('[data-cy="select-option"]', 'Belgium').click();
    cy.getByDataCy('VAT-amount').contains('$16.80');
    cy.contains(breakdownLineSelector, "Today's charge").contains('$96.80');
    cy.contains('div', 'Enter VAT number (if you have one)').click();
    cy.get('input[name=taxIdNumber]').type('FRXX999999998');
    cy.get('button[data-cy="cf-next-step"]').click();
    // Tried to use a french VAT number with Belgium
    cy.contains("The VAT number doesn't match the country");
    cy.get('input[name=taxIdNumber]').type('{selectall}BE-0414445663');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Choose payment method');
    cy.get('button[data-cy="cf-prev-step"]').click();
    cy.contains('BE0414445663'); // Number is properly formatted
    cy.getByDataCy('VAT-amount').contains('$16.80');
    cy.contains(breakdownLineSelector, "Today's charge").contains('$96.80');

    // Let's submit this order!
    cy.getByDataCy('cf-next-step').click();
    cy.useAnyPaymentMethod();
    cy.wait(500);
    cy.contains('button', 'Get tickets').click();
    cy.wait(500);
    cy.getByDataCy('order-success', { timeout: 20000 });
  });

  describe('Outdated Event', () => {
    it("can't contribute if the event is over", () => {
      cy.visit('/opensource/events/webpack-webinar');
      cy.contains('Webinar: How Webpack Reached $400K+/year in Sponsorship & Crowdfunding');
      cy.get('[data-cy="financial-contributions"]').should('not.exist');
      cy.get('[data-cy="Tickets"]').should('not.exist');
    });
  });
});
