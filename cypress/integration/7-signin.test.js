const randomNumber = Math.round(Math.random() * 100000);
const fill = (fieldname, value) => {
  cy.get(`.inputField.${fieldname} input`).type(value);
};

describe('signin', () => {
  it('signin', () => {
    cy.visit('/signin?next=/testuseradmin');
    fill('email', 'testuser+admin@opencollective.com');
    cy.get('.LoginForm button').click();
    cy.get('.LoginTopBarProfileButton-name').contains('testuseradmin', {
      timeout: 15000,
    });
  });

  it('signup', () => {
    cy.visit('/signin?next=/testuseradmin');
    fill('email', `newuser+${randomNumber}@opencollective.com`);
    cy.get('.LoginForm button').click();
    fill('firstName', 'Xavier');
    fill('lastName', 'Damman');
    fill('website', 'http://xdamman.com');
    fill('twitterHandle', 'xdamman');
    fill('description', 'just me :)');
    cy.get('button.signup').click();
    cy.get('.signupSuccessful').contains('success');
  });
});
