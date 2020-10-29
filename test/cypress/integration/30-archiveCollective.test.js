describe('Archive Collective', () => {
  let orgSlug = null;
  let collectiveSlug = null;

  before(() => {
    cy.createCollective({ type: 'ORGANIZATION' }).then(({ slug }) => {
      orgSlug = slug;
    });

    cy.createCollective({ type: 'COLLECTIVE' }).then(({ slug }) => {
      collectiveSlug = slug;
    });
  });

  describe('Archive organization', () => {
    before(() => {
      cy.login({ redirect: `/${orgSlug}/edit/advanced` });
    });

    it('Should archive organization', () => {
      cy.contains('button', 'Archive this Organization').click();
      cy.get('[data-cy=action]').click();
      cy.wait(500);
      cy.contains('This organization has been archived');
    });
  });

  describe('Archive collective', () => {
    before(() => {
      cy.login({ redirect: `/${collectiveSlug}/edit/advanced` });
    });

    it('Should archive collective', () => {
      cy.contains('button', 'Archive this Collective').click();
      cy.get('[data-cy=action]').click();
      cy.wait(500);
      cy.contains('This collective has been archived');

      // test to confirm expenses cannot be submitted for an archived collective
      cy.visit(`${collectiveSlug}/expenses`);
      cy.get('[data-cy=submit-expense-btn]').should('not.exist');

      cy.visit(`${collectiveSlug}`);
      cy.get('[data-cy=submit-expense-btn]').should('not.exist');

      cy.visit(`${collectiveSlug}/expenses/new`);
      cy.contains('This feature is not activated for this collective.');
    });
  });
});
