const randomNumber = Math.round(Math.random() * 100000);

describe('signin', () => {
  it('signin', () => {
    cy.visit('/signin?next=/testuseradmin');
    cy.fillInputField('email', 'testuser+admin@opencollective.com');
    cy.get('.LoginForm button').click();
    cy.get('.LoginTopBarProfileButton-name').contains('testuseradmin', {
      timeout: 15000,
    });
  });

  it('signup', () => {
    cy.visit('/signin?next=/testuseradmin');
    cy.fillInputField('email', `newuser+${randomNumber}@opencollective.com`);
    cy.get('.LoginForm button').click();
    cy.fillInputField('firstName', 'Xavier');
    cy.fillInputField('lastName', 'Damman');
    cy.fillInputField('website', 'http://xdamman.com');
    cy.fillInputField('twitterHandle', 'xdamman');
    cy.fillInputField('description', 'just me :)');
    cy.get('button.signup').click();
    cy.get('.signupSuccessful').contains('success');
  });
});
