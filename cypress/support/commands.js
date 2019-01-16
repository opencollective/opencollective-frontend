import { defaultTestUserEmail } from './data';

Cypress.Commands.add('login', (params = {}) => {
  const { email = defaultTestUserEmail, redirect = null } = params;
  const user = { email, newsletterOptIn: false };

  return signinRequest(user, redirect).then(({ body: { redirect } }) => {
    // Default test user is allowed to signin directly, thus a signin URL
    // is directly returned by the URL. See singin function in
    // opencollective-api/server/controllers/users.js for more info
    cy.visit(redirect);
  });
});

/**
 * Create a collective. Admin will be the user designated by `email`. If not
 * provided, the email used will default to `defaultTestUserEmail`.
 */
Cypress.Commands.add('createCollective', ({ type = 'ORGANIZATION', email = defaultTestUserEmail }) => {
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
            }
          }
        `,
      variables: { collective: { location: {}, name: 'TestOrg', slug: '', tiers: [], type } },
    }).then(({ body }) => {
      return body.data.createCollective;
    });
  });
});

Cypress.Commands.add('addCreditCardToCollective', ({ collectiveSlug }) => {
  cy.login({ redirect: `/${collectiveSlug}/edit/payment-methods` });
  cy.get('.editPaymentMethodsActions button').click();
  cy.wait(2000);
  cy.get('.__PrivateStripeElement iframe').then(iframe => {
    const body = iframe.contents().find('body');

    cy.wrap(body)
      .find('input:eq(1)')
      .type('4242424242424242');

    cy.wrap(body)
      .find('input:eq(2)')
      .type('1222');

    cy.wrap(body)
      .find('input:eq(3)')
      .type('123');

    cy.wrap(body)
      .find('input:eq(4)')
      .type('42222');

    cy.wait(1000);

    cy.get('button[type="submit"]').click();

    cy.wait(2000);
  });
});

Cypress.Commands.add('fillInputField', (fieldname, value) => {
  return cy.get(`.inputField.${fieldname} input`).type(value);
});

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
