import { v4 as uuid } from 'uuid';

/**
 * Generate a random email in the form of "oc-test-*@opencollective.com".
 * These emails match the format of API E2E testing accounts and thus they
 * can be used to signin directly using cy.login().
 * See `opencollective-api/server/controllers/users.js`
 *
 * @param {bool} directSignIn: Set this to false to generage an email that cannot signin directly
 */
export const randomEmail = (directSignIn = true) => {
  const randomID = uuid().split('-')[0];
  return directSignIn ? `oc-test-${randomID}@opencollective.com` : `oc-noDirectSignIn-${randomID}@opencollective.com`;
};

export const randomGmailEmail = () => {
  const randomID = uuid().split('-')[0];
  return `oc-test-${randomID}@gmail.com`;
};

export const randomHotMail = () => {
  const randomID = uuid().split('-')[0];
  return `oc-test-${randomID}@hotmail.com`;
};

export const randomSlug = () => {
  return uuid().split('-')[0];
};

export const randStr = () => {
  return uuid().split('-')[0];
};
