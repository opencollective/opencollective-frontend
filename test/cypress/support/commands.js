import 'cypress-file-upload';
import './third-party-commands';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { loggedInUserQuery } from '../../../lib/graphql/queries';

import { CreditCards } from '../../stripe-helpers';

import { defaultTestUserEmail } from './data';
import { randomEmail, randomSlug } from './faker';
import { disableSmoothScroll } from './helpers';

/**
 * Login with an existing account. If not provided in `params`, the email used for
 * authentication will be `defaultTestUserEmail`.
 *
 * @param {object} params:
 *    - redirect: The redirect URL
 *    - email: User email
 */
Cypress.Commands.add('login', (params = {}) => {
  const { email = defaultTestUserEmail, redirect = null, visitParams } = params;
  const user = { email, newsletterOptIn: false };

  return signinRequest(user, redirect).then(({ body: { redirect } }) => {
    // Test users are allowed to signin directly with E2E, thus a signin URL
    // is directly returned by the API. See signin function in
    // opencollective-api/server/controllers/users.js for more info
    return cy.visit(redirect, visitParams).then(() => user);
  });
});

/**
 * Create a new account an SignIn. If no email is provided in `params`, the account
 * will be generated using a random email.
 */
Cypress.Commands.add('signup', ({ user = {}, redirect = '/', visitParams } = {}) => {
  if (!user.email) {
    user.email = randomEmail();
  }

  return signinRequest(user, redirect).then(({ body: { redirect } }) => {
    // Test users are allowed to signin directly with E2E, thus a signin URL
    // is directly returned by the API. See signin function in
    // opencollective-api/server/controllers/users.js for more info
    const token = getTokenFromRedirectUrl(redirect);
    if (token) {
      return getLoggedInUserFromToken(token).then(user => {
        return cy.visit(redirect, visitParams).then(() => user);
      });
    } else {
      return cy.visit(redirect, visitParams).then(() => user);
    }
  });
});

/**
 * Open a link not covered by `baseUrl`.
 * See https://github.com/cypress-io/cypress/issues/1777
 */
Cypress.Commands.add('openExternalLink', url => {
  cy.visit('/signin').then(window => {
    const linkIdentifier = '__TMP_CY_EXTERNAL_LINK__';
    const link = window.document.createElement('a');
    link.innerHTML = linkIdentifier;
    link.setAttribute('href', url);
    link.setAttribute('id', linkIdentifier);
    window.document.body.appendChild(link);
    cy.get(`#${linkIdentifier}`).click();
  });
});

/**
 * Returns all the email sent by the API
 */
Cypress.Commands.add('getInbox', () => {
  return cy
    .request({
      url: `${Cypress.env('MAILDEV_URL')}/email`,
      method: 'GET',
    })
    .then(({ body }) => {
      return body;
    });
});

/**
 * Navigate to an email in maildev.
 *
 * API must be configured to use maildev
 * - configured by default in development, e2e and ci environments
 * - otherwise MAILDEV_CLIENT=true and MAILDEV_SERVER=true
 *
 * @param emailMatcher {func} - used to find the email. Gets passed an email. To see the
 *  list of all fields, check https://github.com/djfarrelly/MailDev/blob/master/docs/rest.md
 */
Cypress.Commands.add('openEmail', emailMatcher => {
  return loopOpenEmail(emailMatcher);
});

/**
 * Clear maildev inbox.
 */
Cypress.Commands.add('clearInbox', () => {
  return cy.request({
    url: `${Cypress.env('MAILDEV_URL')}/email/all`,
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });
});

/**
 * Create a collective. Admin will be the user designated by `email`. If not
 * provided, the email used will default to `defaultTestUserEmail`.
 */
Cypress.Commands.add('createCollective', ({ type = 'ORGANIZATION', email = defaultTestUserEmail, ...params }) => {
  const user = { email, newsletterOptIn: false };
  return signinRequest(user, null).then(response => {
    const token = getTokenFromRedirectUrl(response.body.redirect);
    return graphqlQuery(token, {
      operationName: 'createCollective',
      query: `
          mutation createCollective($collective: CollectiveInputType!) {
            createCollective(collective: $collective) {
              id
              slug
              name
              description
              longDescription
              website
              imageUrl
              settings
            }
          }
        `,
      variables: { collective: { location: {}, name: 'TestOrg', slug: '', tiers: [], type, ...params } },
    }).then(({ body }) => {
      return body.data.createCollective;
    });
  });
});

/**
 * Create a expense.
 */
Cypress.Commands.add('createExpense', ({ userEmail = defaultTestUserEmail, ...params } = {}) => {
  const expense = {
    category: 'Engineering',
    type: 'INVOICE',
    payoutMethod: 'paypal',
    description: 'Expense 1',
    amount: 10000,
    attachment: 'https://d.pr/free/i/OlQVIb+',
    currency: 'USD',
    ...params,
  };

  return signinRequestAndReturnToken({ email: userEmail }, null).then(token => {
    return graphqlQuery(token, {
      operationName: 'createExpense',
      query: `
          mutation createExpense($expense: ExpenseInputType!) {
            createExpense(expense: $expense) {
              id
              collective {
                id
                slug
              }
            }
          }
        `,
      variables: { expense },
    }).then(({ body }) => {
      return body.data.createExpense;
    });
  });
});

/**
 * Create a collective hosted by the open source collective.
 */
Cypress.Commands.add('createHostedCollective', ({ userEmail = defaultTestUserEmail, ...collectiveParams } = {}) => {
  const collective = {
    slug: randomSlug(),
    name: 'Test Collective',
    type: 'COLLECTIVE',
    ...collectiveParams,
  };

  return signinRequest({ email: userEmail }, null).then(response => {
    const token = getTokenFromRedirectUrl(response.body.redirect);
    return graphqlQuery(token, {
      operationName: 'CreateCollectiveWithHost',
      query: `
        mutation CreateCollectiveWithHost($collective: CollectiveInputType!) {
          createCollectiveFromGithub(collective: $collective) {
            id
            slug
            isActive
            host {
              id
            }
          }
        }
        `,
      variables: { collective },
    }).then(({ body }) => {
      return body.data.createCollectiveFromGithub;
    });
  });
});

/**
 * Add a stripe credit card on the collective designated by `collectiveSlug`.
 */
Cypress.Commands.add('addCreditCardToCollective', ({ collectiveSlug }) => {
  cy.login({ redirect: `/${collectiveSlug}/edit/payment-methods` });
  cy.contains('button', 'Add a credit card').click();
  cy.wait(2000);
  fillStripeInput();
  cy.wait(1000);
  cy.contains('button[type="submit"]', 'Save').click();
  cy.wait(2000);
});

/**
 * Fill a stripe creditcard input.
 *
 * @param container {DOM|null} pass it if you have multiple stripe inputs on the page
 * @param {object} cardParams the credit card info. Defaults to a valid card
 *    - creditCardNumber
 *    - expirationDate
 *    - cvcCode
 *    - postalCode
 */
Cypress.Commands.add('fillStripeInput', fillStripeInput);

/**
 * Completes a 3DSecure Stripe modal
 *
 * @param {boolean} approve: Set to false to reject
 */
Cypress.Commands.add('complete3dSecure', (approve = true) => {
  const iframeSelector = 'iframe[name^="__privateStripeFrame"]';

  return cy.waitUntil(() =>
    cy.get(iframeSelector).then($3dSecureIframe => {
      const $challengeIframe = $3dSecureIframe.contents().find('body iframe#challengeFrame');
      const $acsIframe = $challengeIframe.contents().find('iframe[name="acsFrame"]');
      const $finalContent = $acsIframe.contents().find('body');
      const targetBtn = approve ? '#test-source-authorize-3ds' : '#test-source-fail-3ds';
      $finalContent.find(targetBtn).click();
    }),
  );
});

Cypress.Commands.add('iframeLoaded', { prevSubject: 'element' }, $iframe => {
  const contentWindow = $iframe.prop('contentWindow');
  return new Promise(resolve => {
    if (contentWindow && contentWindow.document.readyState === 'complete') {
      resolve(contentWindow);
    } else {
      $iframe.on('load', () => {
        resolve(contentWindow);
      });
    }
  });
});

/**
 * To use on the "Payment" step in the contribution flow.
 * Use the first payment method if available or fill the
 * stripe form otherwise.
 */
Cypress.Commands.add('useAnyPaymentMethod', () => {
  return cy.get('#PaymentMethod').then($paymentMethod => {
    // Checks if the organization already has a payment method configured
    if (!$paymentMethod.text().includes('VISA **** 4242')) {
      cy.wait(1000); // Wait for stripe to be loaded
      cy.fillStripeInput();
    }
  });
});

/**
 * A helper for the `StepsProgress` component to check that the steps in params
 * are enabled or disabled. `enabled` and `disabled` can both be passed an array
 * of strings or a single string.
 */
Cypress.Commands.add('checkStepsProgress', ({ enabled = [], disabled = [] }) => {
  const isEnabled = step => cy.get(`[data-cy="progress-step-${step}"][data-disabled=false]`);
  const isDisabled = step => cy.get(`[data-cy="progress-step-${step}"][data-disabled=true]`);

  Array.isArray(enabled) ? enabled.forEach(isEnabled) : isEnabled(enabled);
  Array.isArray(disabled) ? disabled.forEach(isDisabled) : isDisabled(disabled);
});

/**
 * Check if user is logged in by searching for its username in navbar
 */
Cypress.Commands.add('assertLoggedIn', (username, timeout) => {
  cy.log('Ensure user is logged in');
  const loginSection = cy.get('.LoginTopBarProfileButton-name', { timeout });
  if (username) {
    loginSection.should('contain', username);
  }
});

/**
 * A helper to fill input fields generated by the `InputField` component.
 */
Cypress.Commands.add('fillInputField', (fieldname, value, cypressOptions) => {
  return cy.get(`.inputField.${fieldname} input`, cypressOptions).type(value);
});

/**
 * Wrapper around `get` specialized to retrieve data from `data-cy`. You can pass an array
 * for deeper queries.
 */
Cypress.Commands.add('getByDataCy', (query, params) => {
  if (Array.isArray(query)) {
    return cy.get(
      query.map(elem => `[data-cy="${elem}"]`),
      params,
    );
  } else {
    return cy.get(`[data-cy="${query}"]`, params);
  }
});

/**
 * Wrapper around `contains` specialized to retrieve data from `data-cy`. You can pass an array
 * for deeper queries.
 */
Cypress.Commands.add('containsInDataCy', (query, content, params) => {
  if (Array.isArray(query)) {
    return cy.contains(
      query.map(elem => `[data-cy="${elem}"]`),
      content,
      params,
    );
  } else {
    return cy.contains(`[data-cy="${query}"]`, content, params);
  }
});

/**
 * Waits for user to be logged in (or timeout)
 * @param {object} params: passed to `cy.get`
 */
Cypress.Commands.add('waitForLoggedIn', params => {
  return cy.getByDataCy('user-menu-trigger', params);
});

/**
 * Helper to disable smooth scroll on page to help prevent cypress from missing elements
 * that may be hidden from view.
 */
Cypress.Commands.add('disableSmoothScroll', () => {
  disableSmoothScroll();
});

/**
 * Add 2FA to a test account
 */
Cypress.Commands.add('enableTwoFactorAuth', ({ userEmail = defaultTestUserEmail, userSlug, secret } = {}) => {
  let authToken;
  return signinRequestAndReturnToken({ email: userEmail, slug: userSlug }, null).then(token => {
    authToken = token;
    return graphqlV2Query(authToken, {
      operationName: 'AccountHasTwoFactorAuth',
      query: `
        query AccountHasTwoFactorAuth($slug: String) {
          individual(slug: $slug) {
            id
            slug
            name
            type
            id
            slug
            name
            type
            ... on Individual {
              hasTwoFactorAuth
            }
          }
        }
          `,
      variables: { slug: userSlug },
      options: { context: API_V2_CONTEXT },
    })
      .then(({ body }) => {
        const account = {
          id: body.data.individual.id,
        };
        const token = secret;

        return graphqlV2Query(authToken, {
          operationName: 'AddTwoFactorAuthToAccount',
          query: `
            mutation AddTwoFactorAuthToAccount($account: AccountReferenceInput!, $token: String!) {
              addTwoFactorAuthTokenToIndividual(account: $account, token: $token) {
                id
                ... on Individual {
                  hasTwoFactorAuth
                }
              }
            }
        `,
          variables: { account, token },
          options: { context: API_V2_CONTEXT },
        });
      })
      .then(({ body }) => {
        return body.data;
      });
  });
});

let localStorageSnapshot = {};

Cypress.Commands.add('resetLocalStorage', () => {
  localStorageSnapshot = {};
  localStorage.clear();
});

Cypress.Commands.add('saveLocalStorage', () => {
  localStorageSnapshot = {};
  Object.keys(localStorage).forEach(key => {
    localStorageSnapshot[key] = localStorage[key];
  });
});

Cypress.Commands.add('restoreLocalStorage', () => {
  Object.keys(localStorageSnapshot).forEach(key => {
    localStorage.setItem(key, localStorageSnapshot[key]);
  });
});

// ---- Private ----

/**
 * @param {object} user - should have `email` and `id` set
 */
function signinRequest(user, redirect) {
  return cy.request({
    url: '/api/users/signin',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user, redirect }),
  });
}

function getTokenFromRedirectUrl(url) {
  const regex = /\/signin\/([^?]+)/;
  return regex.exec(url)[1];
}

/**
 * @param {object} user - should have `email` and `id` set
 */
function signinRequestAndReturnToken(user, redirect) {
  return signinRequest(user, redirect).then(({ body }) => getTokenFromRedirectUrl(body.redirect));
}

function graphqlQuery(token, body) {
  return cy.request({
    url: '/api/graphql',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function graphqlV2Query(token, body) {
  return cy.request({
    url: '/api/graphql/v2',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function getLoggedInUserFromToken(token) {
  return graphqlQuery(token, {
    operationName: 'LoggedInUser',
    query: loggedInUserQuery.loc.source.body,
  }).then(({ body }) => {
    return body.data.LoggedInUser;
  });
}

/**
 * @param {object} params
 *   - container
 *   - card
 */
function fillStripeInput(params) {
  const { container, card } = params || {};
  const stripeIframeSelector = '.__PrivateStripeElement iframe';
  const iframePromise = container ? container.find(stripeIframeSelector) : cy.get(stripeIframeSelector);
  const cardParams = card || CreditCards.CARD_DEFAULT;

  return iframePromise.then(iframe => {
    const { creditCardNumber, expirationDate, cvcCode, postalCode } = cardParams;
    const body = iframe.contents().find('body');
    const fillInput = (index, value) => {
      if (value === undefined) {
        return;
      }

      return cy.wrap(body).find(`input:eq(${index})`).type(`{selectall}${value}`, { force: true });
    };

    fillInput(1, creditCardNumber);
    fillInput(2, expirationDate);
    fillInput(3, cvcCode);
    fillInput(4, postalCode);
  });
}

function loopOpenEmail(emailMatcher, timeout = 8000) {
  return cy.getInbox().then(body => {
    const email = body.find(emailMatcher);
    if (email) {
      return cy.openExternalLink(`${Cypress.env('MAILDEV_URL')}/email/${email.id}/html`);
    } else if (timeout > 0) {
      cy.wait(100);
      return loopOpenEmail(emailMatcher, timeout - 100);
    }
  });
}
