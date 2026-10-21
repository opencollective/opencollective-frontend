import * as cheerio from 'cheerio';

import mockRecaptcha from '../mocks/recaptcha';
import { randomGmailEmail, randomSlug } from '../support/faker';

const visitParams = { onBeforeLoad: mockRecaptcha };

/** Select a country in the org signup form and wait until currency is auto-filled. */
const selectOrganizationCountry = (countryCode: string, searchText: string) => {
  cy.getByDataCy('organization-country-trigger').click();
  cy.getByDataCy('organization-country-search').focus().type(searchText);
  cy.getByDataCy('organization-country-list')
    .find(`[data-cy="organization-country-${countryCode}"]`)
    .should('be.visible')
    .click();
  cy.getByDataCy('organization-country-trigger').should('not.contain', 'Select Country');
  cy.getByDataCy('organization-currency-trigger').should('not.contain', 'Select currency');
  cy.getByDataCy('organization-country-trigger').should('not.have.attr', 'aria-expanded', 'true');
};

/** Type into a Formik-controlled input and wait until the value is committed to the DOM. */
const typeFormField = (selector: string, value: string) => {
  cy.get('@form')
    .find(selector)
    .click()
    .clear()
    .type(value, { delay: 20 })
    .should('have.value', value)
    .then($el => $el[0].blur());
};

/** Fill the org signup form fields in a stable order. Text fields are filled before the country
 *  Select is opened, so Radix's async focus-restore after the Select closes can't steal focus
 *  mid-keystroke (which previously froze the input at a single character). */
const fillOrganizationForm = ({
  legalName,
  name,
  description,
  slug,
}: {
  legalName: string;
  name: string;
  description: string;
  slug: string;
}) => {
  typeFormField('input[name="organization.legalName"]', legalName);
  typeFormField('input[name="organization.name"]', name);
  typeFormField('input[name="organization.description"]', description);
  cy.get('@form')
    .find('input[name="organization.slug"]')
    .click()
    .clear()
    .type(`{selectall}${slug}`, { delay: 20 })
    .should('have.value', slug)
    .then($el => $el[0].blur());
  selectOrganizationCountry('PR', 'Puerto Rico');
};

/** Full page reload: wait for UserProvider before the org form's hidden fields are populated. */
const visitOrganizationSignupAsLoggedInUser = (query = '') => {
  cy.intercept('POST', '/api/graphql/v1', req => {
    if (req.body?.operationName === 'LoggedInUser') {
      req.alias = 'loggedInUser';
    }
  });
  cy.visit(`/signup/organization${query}`, visitParams);
  cy.wait('@loggedInUser');
  cy.getByDataCy('create-organization-form').should('be.visible');
};

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

    it('should coerce user to complete their profile', () => {
      cy.visit('/home', visitParams);
      cy.url().should('include', '/signup/profile');

      cy.visit('/dashboard', visitParams);
      cy.url().should('include', '/signup/profile');
    });

    it('should complete profile and redirect to dashboard', () => {
      cy.getByDataCy('complete-profile-form').as('form');
      cy.get('@form').find('h1').contains("Let's complete your profile");
      cy.get('@form').find('input[name="name"]').type('John Doe');
      cy.get('@form').find('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
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
        cy.url().should('include', `/signup/verify?email=${encodeURIComponent(email)}`);
        cy.url().should('include', `&organization=true`);
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
        cy.url().should('include', '/signup/organization');
        cy.getByDataCy('create-organization-form').should('be.visible');
      });

      it('should create organization', () => {
        cy.get('[data-cy="create-organization-form"]').as('form');
        fillOrganizationForm({
          legalName: 'Cool Stuff 2 Inc.',
          name: 'Cool Stuff 2',
          description: 'We also do super cool stuff',
          slug,
        });
        cy.get('@form').find('button[type="submit"]').should('not.be.disabled').click();
        cy.get('[data-cy="invite-admins-form"]').should('be.visible');
      });

      it('should allow user to invite more admins', () => {
        cy.get('[data-cy="invite-admins-form"]').as('form');
        cy.get('@form').find('h1').contains('Invite your team');
        cy.getByDataCy('add-team-member').click();
        cy.getByDataCy('invite-user-modal-form').as('modalform');
        cy.get('@modalform').find('input[name="name"]').type(`Leo ${randomSlug()}`);
        cy.get('@modalform').find('input[name="email"]').type(inviteeEmail);
        cy.get('@modalform').find('button').click();
        cy.get('@form').find('button[type="submit"]').click();

        cy.openEmail(
          ({ Subject, To }) => getEmailToMatcher(To, inviteeEmail) && Subject.includes('Invitation to join'),
        ).then(email => {
          // @ts-expect-error 2339
          expect(email.HTML).to.include('just invited you to the role of Administrator of');
        });

        cy.url().should('include', `/dashboard/${slug}/overview`);
      });

      it('should create active organization', () => {
        const slug = randomSlug();
        visitOrganizationSignupAsLoggedInUser('?active=true');
        cy.get('[data-cy="create-organization-form"]').as('form');
        fillOrganizationForm({
          legalName: 'Active Org Inc.',
          name: 'Active Org',
          description: 'We manage money and stuff',
          slug,
        });
        cy.get('@form').find('button[type="submit"]').should('not.be.disabled').click();
        cy.getByDataCy('skip-button').click();
        cy.getByDataCy('menu-item-Settings').click();
        cy.getByDataCy('menu-item-advanced').click();
        cy.getByDataCy('money-management-section').find('button').contains('Deactivate');

        cy.getByDataCy('fiscal-hosting-section').find('button').contains('Activate');
      });

      it('should create active fiscal host', () => {
        const slug = randomSlug();
        visitOrganizationSignupAsLoggedInUser('?host=true');
        cy.get('[data-cy="create-organization-form"]').as('form');
        fillOrganizationForm({
          legalName: 'Fiscal Host Inc.',
          name: 'Fiscal Host',
          description: 'We fiscally sponsor collectives',
          slug,
        });
        cy.get('@form').find('button[type="submit"]').should('not.be.disabled').click();
        cy.getByDataCy('skip-button').click();
        cy.getByDataCy('menu-item-Settings').click();
        cy.getByDataCy('menu-item-advanced').click();
        cy.getByDataCy('money-management-section').find('button').contains('Deactivate');
        cy.getByDataCy('fiscal-hosting-section').find('button').contains('Deactivate');
      });
    },
  );

  (describe as unknown as Mocha.SuiteFunction)(
    'Create a new Individual and Collective Profile',
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
        cy.visit('/signup/collective', visitParams);
        cy.getByDataCy('signup-form').as('form');
        cy.get('@form').find('input[name="email"]').type(email);
        cy.get('@form').find('button[type="submit"]').click();
        cy.url().should('include', `/signup/verify?email=${encodeURIComponent(email)}`);
        cy.url().should('include', `&collective=true`);
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

      it('should create collective', () => {
        cy.get('[data-cy="create-collective-form"]').as('form');
        cy.get('@form').find('input[name="collective.name"]').type('Cool Community 2');
        cy.get('@form').find('input[name="collective.description"]').type('A community of cool people');
        cy.get('@form').find('input[name="collective.slug"]').type(`{selectall}${slug}`);
        cy.get('@form').find('button[type="submit"]').click();
      });

      it('should allow user to invite more admins', () => {
        cy.get('[data-cy="invite-admins-form"]').as('form');
        cy.get('@form').find('h1').contains('Invite your team');
        cy.getByDataCy('add-team-member').click();
        cy.getByDataCy('invite-user-modal-form').as('modalform');
        cy.get('@modalform').find('input[name="name"]').type(`Leo ${randomSlug()}`);
        cy.get('@modalform').find('input[name="email"]').type(inviteeEmail);
        cy.get('@modalform').find('button').click();
        cy.get('@form').find('button[type="submit"]').click();

        cy.openEmail(
          ({ Subject, To }) => getEmailToMatcher(To, inviteeEmail) && Subject.includes('Invitation to join'),
        ).then(email => {
          // @ts-expect-error 2339
          expect(email.HTML).to.include('just invited you to the role of Administrator of');
        });
        cy.wait(500); // Wait for redirect
        cy.url().should('include', `/dashboard/${slug}/overview`);
      });

      it('should create collective while logged-in', () => {
        const slug = randomSlug();
        cy.visit('/signup/collective', visitParams);
        cy.get('[data-cy="create-collective-form"]').as('form');
        cy.get('@form').find('input[name="collective.name"]').type('Another Cool Community');
        cy.get('@form').find('input[name="collective.description"]').type('Yet another community of cool people');
        cy.get('@form').find('input[name="collective.slug"]').type(`{selectall}${slug}`);
        cy.get('@form').find('button[type="submit"]').click();
        cy.getByDataCy('skip-button').click();
        cy.wait(500); // Wait for redirect
        cy.url().should('include', `/dashboard/${slug}/overview`);
      });
    },
  );
});

// Generated by Cypress Author on 2026-09-09: profile completion redirect coverage.
describe('profile completion redirects', () => {
  beforeEach(() => {
    cy.mailpitDeleteAllEmails();
    cy.clearLocalStorage();
    cy.clearCookie('accessTokenPayload');
    cy.clearCookie('accessTokenSignature');
  });

  const completeProfile = (name = `Profile User ${randomSlug()}`) => {
    cy.getByDataCy('complete-profile-form').as('profileForm');
    cy.get('@profileForm').find('input[name="name"]').type(name);
    cy.get('@profileForm').find('button[type="submit"]').click();
  };

  it('preserves a requested path and query after completing a profile', () => {
    const destination = `/home?source=${randomSlug()}`;

    cy.signup({ redirect: destination, completeProfile: false });
    cy.location('pathname').should('eq', '/signup/profile');
    cy.location('search').should('eq', `?next=${encodeURIComponent(destination)}`);

    completeProfile();
    cy.wait(1000);
    cy.location('pathname').should('eq', '/home');
    cy.location('search').should('eq', destination.slice(destination.indexOf('?')));
  });
});

// Generated by Cypress Author on 2026-10-20: signup OTP failure-path and redirection coverage.

type StubbedResponse = { statusCode: number; body: Record<string, unknown> };

/**
 * Response bodies mirror the OTP contract implemented in `opencollective-api`'s
 * `server/controllers/users.ts`. The messages asserted below come from `lib/errors/index.js` /
 * `lang/en.json`, except `signup.otp.sessionExpired` which is rendered by `IndividualForm.tsx`.
 */
const INVALID_OTP_RESPONSE: StubbedResponse = {
  statusCode: 403,
  body: { error: { message: 'Invalid or expired OTP code', type: 'INVALID_OTP' } },
};
const SESSION_OVER_RESPONSE: StubbedResponse = {
  statusCode: 403,
  body: { error: { message: 'Not found', type: 'NOT_FOUND' } },
};
const RESEND_SESSION_OVER_RESPONSE: StubbedResponse = {
  statusCode: 401,
  body: { error: { message: 'Not found', type: 'NOT_FOUND' } },
};
const RATE_LIMIT_RESPONSE: StubbedResponse = {
  statusCode: 403,
  body: { error: { message: 'Rate limit exceeded', type: 'RATE_LIMIT_EXCEEDED' } },
};
const USER_ALREADY_EXISTS_RESPONSE: StubbedResponse = {
  statusCode: 403,
  body: { error: { message: 'User already exists', type: 'USER_ALREADY_EXISTS' } },
};
const OTP_REQUEST_EXISTS_RESPONSE: StubbedResponse = {
  statusCode: 401,
  body: { error: { message: 'OTP request already exists', type: 'OTP_REQUEST_EXISTS' } },
};

const OTP_INPUT = 'input[data-slot="input-otp"]';
const INVALID_OTP_MESSAGE = 'The OTP code is invalid or has expired.';
const SESSION_EXPIRED_MESSAGE = 'This verification link is no longer valid. Please start again.';

/**
 * Stub `POST /api/users/signup` so the code step is reached without spending the API's per-IP
 * rate-limit budget on real signups.
 */
const stubSignup = (response: StubbedResponse = { statusCode: 200, body: { success: true, sessionId: 'e2e-otp' } }) =>
  cy.intercept('POST', '/api/users/signup', response).as('signupRequest');

/** Replay `responses` in order on `POST /api/users/verify-email`, holding the last one for extra calls. */
const stubVerifyEmail = (responses: StubbedResponse[]) => {
  let calls = 0;
  cy.intercept('POST', '/api/users/verify-email', req => {
    req.reply(responses[Math.min(calls, responses.length - 1)]);
    calls += 1;
  }).as('verifyEmail');
};

const stubResendOtp = (response: StubbedResponse) =>
  cy.intercept('POST', '/api/users/resend-otp', response).as('resendOtp');

/** Walk through the real signup form to land on the OTP code step. */
const startOtpChallenge = (email: string, { path = '/signup' } = {}) => {
  stubSignup();
  cy.visit(path, visitParams);
  submitEmail(email);
  cy.wait('@signupRequest');
  assertOtpChallengeFor(email);
};

/**
 * Submit the signup form. `.clear()` keeps this idempotent: the form never remounts between steps,
 * so Formik still holds the address typed for a previous attempt and `.type()` would append to it.
 */
const submitEmail = (email: string) => {
  cy.getByDataCy('signup-form').find('input[name="email"]').clear();
  cy.getByDataCy('signup-form').find('input[name="email"]').type(email);
  cy.getByDataCy('signup-form').find('button[type="submit"]').click();
};

/**
 * Assert the OTP challenge is open for `email`.
 *
 * The URL query string is deliberately not asserted: `nextStep()` rebuilds it from whatever the
 * current URL already carries, so `session` can come before `email` (restart) and a hard load of
 * the step re-runs the page effect that drops `email` entirely. The path and the challenge copy
 * are what the user sees, and they are stable.
 */
const assertOtpChallengeFor = (email: string) => {
  cy.url().should('include', '/signup/verify');
  cy.getByDataCy('signup-form').contains(`Enter the code sent to ${email}.`);
  cy.get(OTP_INPUT).should('be.visible');
};

/** `input-otp` keeps its value after a failed submit, so backspace the previous code first. */
const typeOtp = (otp: string) => {
  cy.get(OTP_INPUT).type(`{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}${otp}`);
};

/** A challenge that cannot be retried sends the user back to the email step to start over. */
const shouldBeOnEmailStep = () => {
  cy.location('pathname').should('eq', '/signup');
  cy.getByDataCy('signup-form').find('input[name="email"]').should('be.visible');
};

describe('signup OTP failure and redirection flows', () => {
  // The OTP endpoints are stubbed on purpose: the API rate limits each OTP route at 5 calls per
  // 15 minutes *per IP* and the whole e2e run shares one IP, so driving real wrong-code sequences
  // would burn that budget and make this spec order-dependent. The API side of the contract is
  // covered by `opencollective-api/test/server/controllers/users.test.ts`.
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookie('accessTokenPayload');
    cy.clearCookie('accessTokenSignature');
  });

  it('shows a retryable error and stays on the code step when the code is wrong', () => {
    const email = randomGmailEmail();
    stubVerifyEmail([INVALID_OTP_RESPONSE]);
    startOtpChallenge(email);

    typeOtp('AAAAAA');
    cy.wait('@verifyEmail');

    cy.checkToast({ variant: 'error', message: INVALID_OTP_MESSAGE });
    cy.location('pathname').should('eq', '/signup/verify');
    cy.get(OTP_INPUT).should('be.visible');
  });

  it('returns to the email step when the verification session expired or is unknown', () => {
    const email = randomGmailEmail();
    stubVerifyEmail([SESSION_OVER_RESPONSE]);
    startOtpChallenge(email);

    typeOtp('AAAAAA');
    cy.wait('@verifyEmail');

    cy.checkToast({ variant: 'error', message: SESSION_EXPIRED_MESSAGE });
    shouldBeOnEmailStep();
  });

  it('invalidates the session after three wrong codes and lets the user start over', () => {
    const email = randomGmailEmail();
    stubVerifyEmail([INVALID_OTP_RESPONSE, INVALID_OTP_RESPONSE, SESSION_OVER_RESPONSE]);
    startOtpChallenge(email);

    typeOtp('AAAAAA'); // 1st wrong code: still retryable
    cy.wait('@verifyEmail');
    cy.checkToast({ variant: 'error', message: INVALID_OTP_MESSAGE });
    cy.location('pathname').should('eq', '/signup/verify');

    typeOtp('BBBBBB'); // 2nd wrong code: still retryable
    cy.wait('@verifyEmail');
    cy.location('pathname').should('eq', '/signup/verify');

    typeOtp('CCCCCC'); // 3rd wrong code: the session is invalidated
    cy.wait('@verifyEmail');
    cy.checkToast({ variant: 'error', message: SESSION_EXPIRED_MESSAGE });
    shouldBeOnEmailStep();

    // The same email can immediately open a brand new challenge
    submitEmail(email);
    cy.wait('@signupRequest');
    assertOtpChallengeFor(email);
  });

  it('returns to the email step when resending a code for a dead session', () => {
    const email = randomGmailEmail();
    stubResendOtp(RESEND_SESSION_OVER_RESPONSE);
    startOtpChallenge(email);

    // The resend button is disabled for 30s. Freeze `Date` in the future so the countdown (a real
    // interval created when the step mounted) expires on its next tick instead of waiting it out.
    // The clock is installed after the page has rendered and only stubs `Date`: freezing time before
    // `cy.visit()` stops Next.js from booting at all.
    cy.clock(Date.parse('2042-01-01T00:00:00Z'), ['Date']);
    cy.contains('button', 'Resend').should('not.be.disabled').click();
    cy.wait('@resendOtp');

    cy.checkToast({ variant: 'error', message: SESSION_EXPIRED_MESSAGE });
    shouldBeOnEmailStep();
  });

  it('shows an error and stays on the email step when the account already exists', () => {
    const email = randomGmailEmail();
    stubSignup(USER_ALREADY_EXISTS_RESPONSE);

    cy.visit('/signup', visitParams);
    submitEmail(email);
    cy.wait('@signupRequest');

    cy.checkToast({ variant: 'error', message: 'A user with this email already exists.' });
    shouldBeOnEmailStep();
  });

  it('shows an error and stays on the email step when signup is rate limited', () => {
    const email = randomGmailEmail();
    stubSignup(RATE_LIMIT_RESPONSE);

    cy.visit('/signup', visitParams);
    submitEmail(email);
    cy.wait('@signupRequest');

    cy.checkToast({ variant: 'error', message: 'Rate limit exceeded. Please try again later.' });
    shouldBeOnEmailStep();
  });

  it('shows an error and stays on the email step when an OTP challenge is already open', () => {
    const email = randomGmailEmail();
    stubSignup(OTP_REQUEST_EXISTS_RESPONSE);

    cy.visit('/signup', visitParams);
    submitEmail(email);
    cy.wait('@signupRequest');

    // `OTP_REQUEST_EXISTS` has no i18n entry yet, so only the outcome is asserted: the user is
    // kept on the email step with an error to react to. Update the copy once it is translated.
    cy.getByDataCy('toast-notification').should('be.visible').and('have.attr', 'data-variant', 'error');
    shouldBeOnEmailStep();
  });

  it('goes back to the email step from the code step and drops the session', () => {
    const email = randomGmailEmail();
    startOtpChallenge(email);

    cy.contains('button', 'Go Back').click();

    shouldBeOnEmailStep();
    cy.location('search').should('not.include', 'session');
  });

  it('restores the code step when a verification URL is loaded directly', () => {
    const email = randomGmailEmail();

    // A shared or bookmarked link: the page derives the step from the URL instead of a signup
    cy.visit(`/signup/verify?email=${encodeURIComponent(email)}&session=e2e-otp`, visitParams);

    assertOtpChallengeFor(email);
  });

  it('keeps the organization flow when the verification session dies', () => {
    const email = randomGmailEmail();
    stubVerifyEmail([SESSION_OVER_RESPONSE]);
    startOtpChallenge(email, { path: '/signup/organization' });
    cy.location('search').should('include', 'organization=true');

    typeOtp('AAAAAA');
    cy.wait('@verifyEmail');

    cy.checkToast({ variant: 'error', message: SESSION_EXPIRED_MESSAGE });
    shouldBeOnEmailStep();
    cy.location('search').should('include', 'organization=true');
  });
});
