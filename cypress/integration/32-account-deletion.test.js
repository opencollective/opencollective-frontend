import mockRecaptcha from '../mocks/recaptcha';

describe('Account Deletion', () => {
  it('Should delete collective', () => {
    cy.login().then(() => {
      // Create a new collective
      cy.createCollective({ type: 'COLLECTIVE' }).then(collective => {
        const collectiveSlug = collective.slug;
        cy.visit(`/${collectiveSlug}/edit`);
        cy.wait(1000);
        cy.contains('a', 'Advanced').click();
        cy.contains('button', 'Delete this collective').click();
        cy.get('.confirm-deleteCollective').should('exist');
        cy.get('.confirm-deleteCollective')
          .contains('button', 'Delete')
          .click();
        cy.wait(1000);
        cy.location().should(location => {
          expect(location.search).to.eq('?type=COLLECTIVE');
        });
        cy.contains('h1', 'Your collective has been deleted.');
      });
    });
  });

  it('Should delete user', () => {
    const userParams = { firstName: 'New', lastName: 'Tester' };
    const visitParams = { onBeforeLoad: mockRecaptcha };
    cy.signup({ user: userParams, visitParams }).then(user => {
      cy.visit(`/${user.slug}/edit`);
      cy.wait(1000);
      cy.contains('a', 'Advanced').click();
      cy.contains('button', 'Delete this account.').click();
      cy.get('.confirm-deleteCollective').should('exist');
      cy.get('.confirm-deleteCollective')
        .contains('button', 'Delete')
        .click();
      cy.wait(1000);
      cy.location().should(location => {
        expect(location.search).to.eq('?type=USER');
      });
      cy.contains('h1', 'Your account has been deleted.');
    });
  });
});
