import { defaultTestUserEmail } from '../support/data';
import { randomEmail } from '../support/faker';

describe('Contribution Flow: Guest contributions', () => {
  before(() => {
    cy.clearInbox();
  });

  it('Makes a contribution as an existing user', () => {
    cy.visit('/apex/donate');
    cy.contains('[data-cy="amount-picker"] button', 'Other').click();
    cy.get('input[name="custom-amount"]').type('{selectall}400.42');
    cy.contains('#interval button', 'Monthly').click();
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Contribute as a guest');
    cy.get('input[name=email]').type(defaultTestUserEmail);
    cy.get('input[name=name]').type('Jack London');
    cy.wait(200);
    cy.get('button[data-cy="cf-next-step"]').click();

    cy.useAnyPaymentMethod();
    cy.contains('button[data-cy="cf-next-step"]', 'Contribute $400.42').click();

    cy.contains('[data-cy="order-success"]', 'You are now supporting APEX.');
    cy.contains('[data-cy="order-success"]', '$400.42 USD');

    // Open email
    const expectedEmailSubject = 'Thank you for your contribution to APEX';
    cy.openEmail(({ subject }) => subject.includes(expectedEmailSubject));
    cy.contains('If you need help, contact');
  });

  it('Joins after a single contribution', () => {
    cy.visit('/apex/donate');
    cy.contains('[data-cy="amount-picker"] button', '$10').click();
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Contribute as a guest');

    // Test validations
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.get('input[name=email]:invalid').should('have.length', 1); // Empty

    cy.get('input[name=email]').type('xxxxxxxxxxx');
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.get('input[name=email]:invalid').should('have.length', 1); // Invalid email

    const email = randomEmail();
    cy.get('input[name=email]').type(`{selectall}${email}`);
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.useAnyPaymentMethod();
    cy.wait(500);
    cy.contains('button[data-cy="cf-next-step"]', 'Contribute $10').click();

    cy.contains('[data-cy="order-success"]', 'You are now supporting APEX.');
    cy.contains('[data-cy="order-success"]', '$10.00 USD');
    cy.getByDataCy('join-opencollective-link').click();

    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${email}`);

    // Open email
    const expectedEmailSubject = 'Open Collective: Verify your email';
    cy.openEmail(({ subject, html }) => html.includes(email) && subject.includes(expectedEmailSubject));
    cy.contains('a[href*="/confirm/guest"]', 'Verify').click();

    // Redirected from email
    cy.location('pathname').should('include', '/confirm/guest');
    cy.contains('Your email has been confirmed');

    // Redirected to profile, contains all transactions
    cy.location('pathname').should('include', '/user-');
    cy.contains('Incognito'); // Default user name
    cy.contains('[data-cy="hero-total-amount-contributed"]', '$10.00 USD');
    cy.contains('[data-cy="transaction-item"]', 'Financial contribution to APEX').should('have.length', 1);
    cy.contains('[data-cy="transaction-item"]', '$10.00');
  });

  describe('Make multiple contributions in the same session', () => {
    const firstEmail = randomEmail();
    const secondEmail = randomEmail();

    // Ensure local storage is persisted between tests so we can test cases with multiple profiles
    before(() => {
      cy.resetLocalStorage();
    });

    beforeEach(() => {
      cy.restoreLocalStorage();
    });

    afterEach(() => {
      cy.saveLocalStorage();
    });

    it('Make a small contribution ($10)', () => {
      cy.visit('/apex/donate');
      cy.contains('[data-cy="amount-picker"] button', '$10').click();
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.contains('Contribute as a guest');

      cy.get('input[name=name]').type('Rick Astley');
      cy.get('input[name=email]').type(`{selectall}${firstEmail}`);
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.useAnyPaymentMethod();
      cy.wait(500);
      cy.contains('button[data-cy="cf-next-step"]', 'Contribute $10').click();

      cy.contains('[data-cy="order-success"]', 'You are now supporting APEX.');
      cy.contains('[data-cy="order-success"]', '$10.00 USD');

      cy.location('search').then(search => {
        cy.getByDataCy('join-opencollective-link').should('have.attr', 'href', `/create-account/guest${search}`);
      });
    });

    it('Make a medium contribution ($500)', () => {
      cy.visit('/apex/donate');
      cy.get('[data-cy="amount-picker-btn-other"]').click();
      cy.get('input[type=number][name=custom-amount]').type('{selectall}500');
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.contains('Contribute as a guest');

      // Test validations (name is now required)
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.get('input[name=name]:invalid').should('not.exist'); // Name is optional
      cy.get('input[name=legalName]:invalid').should('have.length', 1); // Legal name is not (contrib > $500)
      cy.get('input[name=email]:invalid').should('have.length', 1); // Empty

      cy.get('input[name=name]').type('Rick Astley');
      cy.get('input[name=legalName]:invalid').should('not.exist'); // Legal name is optional if name is provided
      cy.get('input[name=email]').type(`{selectall}${firstEmail}`);
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.useAnyPaymentMethod();
      cy.contains('button[data-cy="cf-next-step"]', 'Contribute $500').click();

      cy.contains('[data-cy="order-success"]', 'You are now supporting APEX.');
      cy.contains('[data-cy="order-success"]', '$500.00 USD');

      cy.location('search').then(search => {
        cy.getByDataCy('join-opencollective-link').should('have.attr', 'href', `/create-account/guest${search}`);
      });
    });

    it('Make a large contribution ($5000)', () => {
      cy.visit('/apex/donate');
      cy.get('[data-cy="amount-picker-btn-other"]').click();
      cy.get('input[type=number][name=custom-amount]').type('{selectall}5000');
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.contains('Contribute as a guest');

      // Test validations (location is now required)
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.get('input[name=name]:invalid').should('not.exist'); // Name is optional
      cy.get('input[name=legalName]:invalid').should('have.length', 1); // Legal name is not (contrib > $500)
      cy.get('input[name=email]:invalid').should('have.length', 1); // Empty
      // TODO: We're not showing errors on the country select yet
      // cy.get('input[name="location.country"]:invalid').should('have.length', 1);
      cy.get('button[data-cy="cf-next-step"]').click();
      cy.get('[data-cy="cf-content"] [data-cy="country-select"]').click();
      cy.contains('[data-cy="select-option"]', 'France').click();
      cy.get('input[name="address1"]:invalid').should('have.length', 1); // Empty
      cy.get('input[name="postalCode"]:invalid').should('have.length', 1); // Empty
      cy.get('input[name="city"]:invalid').should('have.length', 1); // Empty

      // Fill profile info
      cy.get('input[name=name]').type('Rick Astley');
      cy.get('input[name=email]').type(`{selectall}${secondEmail}`);
      cy.get('input[name="address1"]').type('323 Logic Street');
      cy.get('input[name="postalCode"]').type('83740');
      cy.get('input[name="city"]').type("La Cadière d'Azur");

      cy.get('button[data-cy="cf-next-step"]').click();
      cy.useAnyPaymentMethod();
      cy.wait(500);
      cy.contains('button[data-cy="cf-next-step"]', 'Contribute $5,000').click();

      cy.contains('[data-cy="order-success"]', 'You are now supporting APEX.');
      cy.contains('[data-cy="order-success"]', '$5,000.00 USD');

      cy.location('search').then(search => {
        cy.getByDataCy('join-opencollective-link').should('have.attr', 'href', `/create-account/guest${search}`);
      });
    });

    /**
     * This test depends on the previous ones, as we expect data from local storage to be
     * persisted between them.
     */
    it('Join Open Collective', () => {
      cy.visit('/create-account/guest');
      cy.contains('We found 2 emails that you used to contribute');
      cy.contains(firstEmail);
      cy.contains(secondEmail);
      cy.getByDataCy('send-verification-email-btn').should('be.disabled');

      cy.contains('[data-cy="guest-email-entry"]', firstEmail).click();
      cy.getByDataCy('send-verification-email-btn').click();
      cy.contains('Your magic link is on its way!');
      cy.contains(`We've sent it to ${firstEmail}`);

      // Open email
      const expectedEmailSubject = 'Open Collective: Verify your email';
      cy.openEmail(({ subject, html }) => html.includes(firstEmail) && subject.includes(expectedEmailSubject));
      cy.contains('a[href*="/confirm/guest"]', 'Verify').click();

      // Redirected from email
      cy.location('pathname').should('include', '/confirm/guest');
      cy.contains('Your email has been confirmed');

      // Redirected to profile, contains all transactions
      cy.location('pathname').should('include', '/rick-astley'); // Used name to generate the profile
      cy.contains('Rick Astley');
      cy.contains('[data-cy="hero-total-amount-contributed"]', '$510.00 USD');
      cy.get('[data-cy="transaction-item"]').should('have.length', 2);
      cy.contains('[data-cy="transaction-item"]', '$10.00');
      cy.contains('[data-cy="transaction-item"]', '$500.00');
    });
  });
});
