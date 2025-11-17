import * as cheerio from 'cheerio';

import mockRecaptcha from '../mocks/recaptcha';
import { randomGmailEmail, randomSlug } from '../support/faker';

const visitParams = { onBeforeLoad: mockRecaptcha };

const getEmailToMatcher = (To, email) =>
  To[0].Address.includes(email) || To[0].Address.includes(email.replace(/@/g, '-at-'));

describe('/signup', () => {
  (describe as unknown as Mocha.SuiteFunction)('Create a new Individual Profile', { testIsolation: false }, () => {
    const email = randomGmailEmail();
    before(() => {
      cy.mailpitDeleteAllEmails();
      cy.clearLocalStorage();
      cy.clearCookie('accessTokenPayload');
      cy.clearCookie('accessTokenSignature');
    });

    it('should request email', () => {
      cy.visit('/signup', visitParams);
      cy.getByDataCy('signup-form').as('form');
      cy.get('@form').find('input[name="email"]').type(email);
      cy.get('@form').find('button[type="submit"]').click();
      cy.url().should('include', `/signup/verify?email=${encodeURIComponent(email)}`);
      cy.reload();
      cy.url().should('include', `/signup/verify?email=${encodeURIComponent(email)}`);
    });

    it('should send OTP through email', () => {
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

    it('should redirect to complete profile if user is signed in', () => {
      cy.visit('/signup', visitParams);
      cy.url().should('include', '/signup/profile');
    });

    it('should complete profile and redirect to welcome page', () => {
      cy.getByDataCy('complete-profile-form').as('form');
      cy.get('@form').find('h1').contains("Let's complete your profile");
      cy.get('@form').find('input[name="name"]').type('John Doe');
      cy.get('@form').find('button[type="submit"]').click();
      cy.url().should('include', '/welcome');
      cy.getByDataCy('welcome-username').contains('John Doe');
    });
  });

  (describe as unknown as Mocha.SuiteFunction)(
    'Create a new Individual and Organization Profile',
    { testIsolation: false },
    () => {
      const email = randomGmailEmail();
      const inviteeEmail = randomGmailEmail();
      const slug = randomSlug();

      before(() => {
        cy.mailpitDeleteAllEmails();
        cy.clearLocalStorage();
        cy.clearCookie('accessTokenPayload');
        cy.clearCookie('accessTokenSignature');
      });

      it('completes individual profile', () => {
        cy.visit('/signup/organization', visitParams);
        cy.getByDataCy('signup-form').as('form');
        cy.get('@form').find('input[name="email"]').type(email);
        cy.get('@form').find('button[type="submit"]').click();
        cy.url().should('include', `/signup/verify?email=${encodeURIComponent(email)}&organization=true`);
      });

      it('should send OTP through email', () => {
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

      it('should complete profile', () => {
        cy.getByDataCy('complete-profile-form').as('form');
        cy.get('@form').find('h1').contains("Let's complete your profile");
        cy.get('@form').find('input[name="name"]').type('John Doe');
        cy.get('@form').find('button[type="submit"]').click();
      });

      it('should create organization', () => {
        cy.get('[data-cy="create-organization-form"]').as('form');
        cy.getByDataCy('organization-country-trigger').click();
        cy.getByDataCy('organization-country-search').focus().type('Puerto');
        cy.getByDataCy('organization-country-list').find('[data-cy="organization-country-PR"]').click();
        cy.get('@form').find('input[name="organization.legalName"]').type('Cool Stuff 2 Inc.');
        cy.get('@form').find('input[name="organization.name"]').type('Cool Stuff 2');
        cy.get('@form').find('input[name="organization.description"]').type('We also do super cool stuff');
        cy.get('@form').find('input[name="organization.slug"]').type(`{selectall}${slug}`);
        cy.get('@form').find('button[type="submit"]').click();
      });

      it('should allow user to invite more admins', () => {
        cy.get('[data-cy="invite-admins-form"]').as('form');
        cy.get('@form').find('h1').contains('Invite your team');
        cy.getByDataCy('add-team-member').click();
        cy.get('@form').find('input[name="invitedAdmins.0.name"]').type(`Leo ${randomSlug()}`);
        cy.get('@form').find('input[name="invitedAdmins.0.email"]').type(inviteeEmail);
        cy.get('@form').find('button[type="submit"]').click();

        cy.openEmail(
          ({ Subject, To }) => getEmailToMatcher(To, inviteeEmail) && Subject.includes('Invitation to join'),
        ).then(email => {
          // @ts-expect-error 2339
          expect(email.HTML).to.include('just invited you to the role of Administrator of');
        });

        cy.url().should('include', `/dashboard/${slug}/overview`);
      });
    },
  );
});
