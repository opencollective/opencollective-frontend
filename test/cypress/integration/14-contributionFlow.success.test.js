import mockRecaptcha from '../mocks/recaptcha';

const newFlowRoute = '/apex/donate';

/**
 * Test the order flow's success page.
 */
describe('Contribution Flow: Order success', () => {
  const userParams = { firstName: 'Order', lastName: 'Tester' };
  const publicMessage = "Wow such an amazing project 💙 Let's take it to the moon!!! 🚀";

  describe('New flow', () => {
    before(() => {
      const visitParams = { onBeforeLoad: mockRecaptcha };
      cy.signup({ user: userParams, redirect: newFlowRoute, visitParams }).then(() => {
        cy.waitForLoggedIn();
        cy.contains('button', 'Next step').click();
        cy.wait(50);
        cy.contains('button', 'Next step').click();
        cy.wait(4000); // Wait for stripe to be loaded
        cy.useAnyPaymentMethod();
        cy.wait(1000);
        cy.contains('button', 'Make contribution').click();
        cy.wait(4000);
      });
    });

    it('can post public messages', () => {
      // Limited to 140 characters
      cy.get('textarea[name=publicMessage]').type('.'.repeat(142), { delay: 1 });
      cy.get('textarea[name=publicMessage]').should('have.value', '.'.repeat(140));

      // Fill with a real message
      cy.get('textarea[name=publicMessage]').type('{selectall}{backspace}');
      cy.get('textarea[name=publicMessage]').type('Adding this');
      cy.contains('button', 'Post message').click();
      cy.contains('button', 'Saved');

      // Can edit
      cy.get('textarea[name=publicMessage]').type('{selectall}{backspace}');
      cy.get('textarea[name=publicMessage]').type(publicMessage);
      cy.contains('button', 'Post message').click();
      cy.contains('button', 'Saved');
    });
  });
});
