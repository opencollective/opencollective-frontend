const defaultTestUserEmail = 'testuser+admin@opencollective.com';

Cypress.Commands.add('login', (params = {}) => {
  const { email = defaultTestUserEmail, redirect = null } = params;
  const user = { email, newsletterOptIn: false };

  return cy
    .request({
      url: '/api/users/signin',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user, redirect }),
    })
    .then(({ body: { redirect } }) => {
      // Default test user is allowed to signin directly, thus a signin URL
      // is directly returned by the URL. See singin function in
      // opencollective-api/server/controllers/users.js for more info
      cy.visit(redirect);
    });
});

Cypress.Commands.add('fillInputField', (fieldname, value) => {
  return cy.get(`.inputField.${fieldname} input`).type(value);
});
