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
        cy.get('[data-cy=delete]').click();
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
    cy.signup({ user: userParams, visitParams }).then(() => {
      cy.wait(2000);
      cy.get('.LoginTopBarProfileButton-name').click();
      cy.contains('a', 'Profile').click();
      cy.contains('button', 'edit profile').click();
      cy.contains('a', 'Advanced').click();
      cy.contains('button', 'Delete this account').click();
      cy.get('[data-cy=delete]').click();
      cy.wait(1000);
      cy.location().should(location => {
        expect(location.search).to.eq('?type=USER');
      });
      cy.contains('h1', 'Your account has been deleted.');
    });
  });
});
