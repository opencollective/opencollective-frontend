import * as cheerio from 'cheerio';

import { defaultTestUserEmail } from '../support/data';
import { randomEmail } from '../support/faker';

const getEmailToMatcher = (To, email) =>
  To[0].Address.includes(email) || To[0].Address.includes(email.replace(/@/g, '-at-'));

describe('Contribution Flow: Guest contributions', () => {
  before(() => {
    cy.mailpitDeleteAllEmails();
  });

  it('Makes a contribution as an existing user', () => {
    cy.visit('/apex/donate');
    cy.contains('[data-cy="amount-picker"] button', 'Other').click();
    cy.get('input[name="custom-amount"]').type('{selectall}400.42');
    cy.contains('#interval button', 'Monthly').click();
    cy.get('button[data-cy="cf-next-step"]').click();
    cy.contains('Contribute as a guest');
    cy.get('input[name=email]').type(defaultTestUserEmail);
    cy.getByDataCy('input-name').type('Jack London');
    cy.getByDataCy('input-legalName').type('Very Legal Organization');
    cy.wait(200);
    cy.get('button[data-cy="cf-next-step"]').click();

    cy.useAnyPaymentMethod();
    cy.contains('button[data-cy="cf-next-step"]', 'Contribute $400.42').click();

    cy.contains('[data-cy="order-success"]', 'You are now supporting APEX.');
    cy.contains('[data-cy="order-success"]', '$400.42 USD');

    // Open email
    const expectedEmailSubject = 'Thank you for your contribution to APEX';
    cy.openEmail(({ Subject }) => Subject.includes(expectedEmailSubject)).then(email => {
      expect(email.HTML).to.include('If you need help, contact');
    });
  });

  it('Joins after a single contribution', () => {
    cy.mailpitDeleteAllEmails();

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
    cy.getByDataCy('signup-form').as('form');
    cy.get('@form').find('input[name="email"]').should('have.value', email);
    cy.get('@form').find('button[type="submit"]').click();
    cy.url().should('include', `/signup/verify?email=${encodeURIComponent(email)}`);
    cy.getByDataCy('signup-form').as('otp-form');
    cy.get('@otp-form').contains(`Enter the code sent to ${email}.`);
    cy.openEmail(({ Subject, To }) => getEmailToMatcher(To, email) && Subject.includes('Email Confirmation')).then(
      email => {
        const $html = cheerio.load(email.HTML);
        const otp = $html('h3 > span').text();
        cy.get('@otp-form').find('input[data-slot="input-otp"]').type(otp);
      },
    );
    cy.url().should('include', '/signup/profile');
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

      cy.getByDataCy('join-opencollective-link').should(
        'have.attr',
        'href',
        `/signup?email=${encodeURIComponent(firstEmail)}`,
      );
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

      cy.getByDataCy('input-name').type('Rick Astley');
      cy.getByDataCy('input-legalName').type('Very Legal Organization');

      cy.get('input[name=email]').type(`{selectall}${firstEmail}`);
      cy.get('button[data-cy="cf-next-step"]').click();

      cy.useAnyPaymentMethod();
      cy.contains('button[data-cy="cf-next-step"]', 'Contribute $500').click();

      cy.contains('[data-cy="order-success"]', 'You are now supporting APEX.');
      cy.contains('[data-cy="order-success"]', '$500.00 USD');

      cy.getByDataCy('join-opencollective-link').should(
        'have.attr',
        'href',
        `/signup?email=${encodeURIComponent(firstEmail)}`,
      );
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

      cy.getByDataCy('join-opencollective-link').should(
        'have.attr',
        'href',
        `/signup?email=${encodeURIComponent(secondEmail)}`,
      );
    });
  });
});
