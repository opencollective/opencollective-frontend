import mockRecaptcha from '../mocks/recaptcha';

/**
 * Test the order flow's success page.
 */
describe('Contribution Flow: Order success', () => {
  const donateURL = '/apex/donate';
  const userParams = { firstName: 'Order', lastName: 'Tester' };

  before(() => {
    const visitParams = { onBeforeLoad: mockRecaptcha };
    cy.signup({ user: userParams, redirect: donateURL, visitParams }).then(() => {
      cy.contains('button', 'Next step').click();
      cy.wait(50);
      cy.contains('button', 'Next step').click();
      cy.wait(1000); // Wait for stripe to be loaded
      cy.fillStripeInput();
      cy.contains('button', 'Make contribution').click();
      cy.wait(4000);
    });
  });

  it('can post public messages', () => {
    const publicMessage = "Wow such an amazing project 💙 Let's take it to the moon!!! 🚀";

    // Public message popup
    cy.contains('[data-cy=EditPublicMessagePopup]', 'Leave a public message (Optional)');

    // Limited to 140 characters
    cy.get('textarea[name=publicMessage]').type('.'.repeat(142), { delay: 1 });
    cy.get('textarea[name=publicMessage]').should('have.value', '.'.repeat(140));

    // Fill with a real message
    cy.get('textarea[name=publicMessage]').type('{selectall}{backspace}');
    cy.get('textarea[name=publicMessage]').type(publicMessage);
    cy.contains('button', 'Submit').click();

    // Card should be updated with the message, can be edited on click
    cy.get('[data-cy=EditPublicMessagePopup]').should('not.exist');
    cy.contains(`“${publicMessage}”`).click();
    cy.contains('[data-cy=EditPublicMessagePopup]', 'Leave a public message (Optional)');
    cy.get('textarea[name=publicMessage]').should('have.value', publicMessage);
  });
});
