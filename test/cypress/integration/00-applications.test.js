const checkCodeExist = () => {
  return cy.get('[data-cy=api-key] code').should($code => {
    expect($code.text()).to.have.length(40);
  });
};

describe('Applications', () => {
  let user = null;

  before(() => {
    cy.signup({ redirect: '/applications' }).then(u => (user = u));
  });

  beforeEach(() => {
    cy.login({ email: user.email, redirect: '/applications' });
  });

  it('Can create and delete keys', () => {
    cy.contains('No API Key registered.');
    cy.contains('button', 'New API Key').click();
    checkCodeExist();
    cy.contains('a', 'Delete').click();
    cy.contains('No API Key registered.');
  });

  it('Keys stay after reloading the page', () => {
    cy.contains('No API Key registered.');
    cy.contains('button', 'New API Key').click();
    checkCodeExist();
    cy.reload();
    checkCodeExist();
    cy.contains('a', 'Delete').click();
    cy.contains('No API Key registered.');
  });
});
