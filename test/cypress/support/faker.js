import uuidv4 from 'uuid/v4';

/**
 * Generate a random email in the form of "oc-test-*@opencollective.com".
 * These emails match the format of API E2E testing accounts and thus they
 * can be used to signin directly using cy.login().
 * See `opencollective-api/server/controllers/users.js`
 *
 * @param {bool} directSignIn: Set this to false to generage an email that cannot signin directly
 */
export const randomEmail = (directSignIn = true) => {
  const randomID = uuidv4().split('-')[0];
  return directSignIn ? `oc-test-${randomID}@opencollective.com` : `oc-noDirectSignIn-${randomID}@opencollective.com`;
};

export const randomGmailEmail = () => {
  const randomID = uuidv4().split('-')[0];
  return `oc-test-${randomID}@gmail.com`;
};

export const randomHotMail = () => {
  const randomID = uuidv4().split('-')[0];
  return `oc-test-${randomID}@outlook.com`;
};

export const randomSlug = () => {
  return uuidv4().split('-')[0];
};
