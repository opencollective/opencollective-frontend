describe('Archive Collective', () => {
  it('Should archive organization', () => {
    cy.login().then(() => {
      // Create a new organization
      cy.createCollective({ type: 'ORGANIZATION' }).then(collective => {
        const collectiveSlug = collective.slug;
        cy.visit(`/${collectiveSlug}`);
        cy.wait(1000);
        cy.contains('button', 'edit organization').click();
        cy.contains('a', 'Advanced').click();
        cy.contains('button', 'Archive this organization').click();
        cy.get('.confirm-ArchiveCollective').should('exist');
        cy.get('.confirm-ArchiveCollective')
          .contains('button', 'Archive')
          .click();
        cy.wait(500);
        cy.contains('This organization has been archived');
      });
    });
  });

  it('Should archive collective', () => {
    cy.login().then(() => {
      // Create a new collective
      cy.createCollective({ type: 'COLLECTIVE' }).then(collective => {
        const collectiveSlug = collective.slug;
        cy.visit(`/${collectiveSlug}/edit`);
        cy.wait(1000);
        cy.contains('a', 'Advanced').click();
        cy.contains('button', 'Archive this collective').click();
        cy.get('.confirm-ArchiveCollective').should('exist');
        cy.get('.confirm-ArchiveCollective')
          .contains('button', 'Archive')
          .click();
        cy.wait(500);
        cy.contains('This collective has been archived');
      });
    });
  });
});
