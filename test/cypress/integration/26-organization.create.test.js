describe('create an organization', () => {
  beforeEach(() => {
    cy.login({ redirect: '/organizations/new' });
  });

  it('Creates an organization successfully without co-admin', () => {
    cy.contains('Create Organization');
    cy.get('[data-cy="cof-form-name"]').type('testorganization12');
    cy.getByDataCy('cof-form-slug')
      .first()
      .find('input')
      .invoke('val')
      .then(sometext => expect(sometext).to.equal('testorganization12'));
    cy.get('[data-cy="cof-org-description"]').type('short description for new org');
    cy.get('[data-cy="cof-org-website"]').type('ww.com');
    cy.get('[data-cy="custom-checkbox"]').click();
    cy.wait(250);
    cy.get('[data-cy="cof-form-submit"]').click();
    cy.wait(300);
    cy.contains('Your Organization has been created.');
    cy.wait(300);
  });

  it('Shows an Error if Authorization is not checked', () => {
    cy.contains('Create Organization');
    cy.wait(300);
    cy.get('[data-cy="cof-form-name"]').type('testOrganization10');
    cy.get('[data-cy="cof-org-description"]').type('short description for new org');
    cy.get('[data-cy="cof-org-website"]').type('ww.com');
    cy.get('[data-cy="cof-form-submit"]').click();
    cy.get('[data-cy="cof-error-message"]').contains('Verify that you are an authorized organization representative');
  });
});
