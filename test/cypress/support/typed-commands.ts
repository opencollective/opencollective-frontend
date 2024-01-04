// eslint-disable-next-line spaced-comment
/// <reference types="cypress" />
declare global {
  namespace Cypress {
    interface Chainable {
      retryChain<T extends any>(
        chain: () => Chainable<T>,
        assert: (subject: T) => void,
        options?: { maxAttempts?: number; wait?: number },
        attempts?: number,
      ): Chainable<T>;
    }
  }
}

// eslint-disable-next-line prefer-arrow-callback
Cypress.Commands.add('retryChain', function <
  T extends any,
>(chain: () => Cypress.Chainable<T>, assert, options = { maxAttempts: 10, wait: 1000 }, attempts = 0) {
  return chain().then(subject => {
    try {
      assert(subject);
    } catch (e) {
      if (attempts >= (options.maxAttempts ?? 10)) {
        throw e;
      }
      cy.wait(options.wait ?? 1000);
      return cy.retryChain(chain, assert, options, attempts + 1);
    }
  });
});

export {};
