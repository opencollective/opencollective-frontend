describe('Unarchive collective', () => {
  it('Should unarchive organization', () => {
    cy.login().then(() => {
      // Create a new organization
      cy.createCollective({ type: 'ORGANIZATION' }).then(collective => {
        const collectiveSlug = collective.slug;
        cy.visit(`/${collectiveSlug}/edit/advanced`);
        // Archive the collective
        cy.contains('button', 'Archive this organization').click();
        cy.get('[data-cy=action]').click();
        cy.wait(500);
        cy.contains('This organization has been archived');
        // Unarchive collective
        cy.contains('button', 'Unarchive this organization').click();
        cy.get('[data-cy=action]').click();
        cy.wait(1000);
        // Archive this organization button should show back
        // after unarchiving successfully
        cy.contains('button', 'Archive this organization');
      });
    });
  });
});
