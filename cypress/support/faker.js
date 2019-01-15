import uuidv4 from 'uuid/v4';

/**
 * Generate a random email in the form of "oc-test-*@opencollective.com".
 * These emails match the format of API E2E testing accounts and thus they
 * can be used to signin directly using cy.login().
 * See `opencollective-api/server/controllers/users.js`
 */
export const randomEmail = () => {
  return `oc-test-${uuidv4().split('-')[0]}@opencollective.com`;
};
