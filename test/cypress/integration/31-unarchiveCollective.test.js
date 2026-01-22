describe('Unarchive collective', () => {
  let orgSlug = null;

  before(() => {
    cy.createCollective({ type: 'ORGANIZATION' }).then(({ slug }) => {
      orgSlug = slug;
      cy.login({ redirect: `/dashboard/${orgSlug}/advanced` });
    });
  });

  it('Should unarchive organization', () => {
    // Archive the collective
    cy.contains('button', 'Archive this Organization').click();
    cy.get('[data-cy=action]').click();
    cy.contains('This organization has been archived', { timeout: 10000 });
    // Unarchive collective
    cy.contains('button', 'Unarchive this Organization').click();
    cy.get('[data-cy=action]').click();
    cy.contains('button', 'Archive this Organization', { timeout: 10000 }).should('be.visible');
    // Archive this organization button should show back
    // after unarchiving successfully
    cy.contains('button', 'Archive this Organization');
  });
});
