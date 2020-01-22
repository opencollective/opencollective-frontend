describe('Archive Collective', () => {
  it('Should archive organization', () => {
    cy.login().then(() => {
      // Create a new organization
      cy.createCollective({ type: 'ORGANIZATION' }).then(collective => {
        const collectiveSlug = collective.slug;
        cy.visit(`/${collectiveSlug}/edit/advanced`);
        cy.contains('button', 'Archive this organization').click();
        cy.get('[data-cy=action]').click();
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
        cy.visit(`/${collectiveSlug}/edit/advanced`);
        cy.contains('button', 'Archive this collective').click();
        cy.get('[data-cy=action]').click();
        cy.wait(500);
        cy.contains('This collective has been archived');

        // test to confirm expenses cannot be submitted for an archived collective
        cy.visit(`${collectiveSlug}/expenses`);
        cy.get('[data-cy=submit-expense-btn]').should('not.exist');

        cy.visit(`${collectiveSlug}`);
        cy.get('[data-cy=submit-expense-btn]').should('not.exist');

        cy.visit(`${collectiveSlug}/expenses/new`);
        cy.get('.CreateExpenseForm').contains('Cannot submit expenses for an archived collective.');
      });
    });
  });
});
