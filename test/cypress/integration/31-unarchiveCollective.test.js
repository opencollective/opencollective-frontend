describe('Unarchive collective', () => {
  let orgSlug = null;

  before(() => {
    cy.createCollective({ type: 'ORGANIZATION' }).then(({ slug }) => {
      orgSlug = slug;
      cy.login({ redirect: `/${orgSlug}/edit/advanced` });
    });
  });

  it('Should unarchive organization', () => {
    // Archive the collective
    cy.contains('button', 'Archive this Organization').click();
    cy.get('[data-cy=action]').click();
    cy.wait(500);
    cy.contains('This organization has been archived');
    // Unarchive collective
    cy.contains('button', 'Unarchive this Organization').click();
    cy.get('[data-cy=action]').click();
    cy.wait(1000);
    // Archive this organization button should show back
    // after unarchiving successfully
    cy.contains('button', 'Archive this Organization');
  });
});
