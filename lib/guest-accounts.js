import { omitBy, uniq } from 'lodash';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from './local-storage';

/**
 * Returns a map like { [email]: token }
 */
const getAllGuestTokens = () => {
  try {
    const localStorageValue = getFromLocalStorage(LOCAL_STORAGE_KEYS.GUEST_TOKENS);
    return JSON.parse(localStorageValue) || {};
  } catch (e) {
    return {};
  }
};

const normalizeGuestToken = (key, value) => {
  if (typeof value === 'string') {
    return { email: key, token: value };
  } else {
    return { email: value.email, token: value.email, orderId: key };
  }
};

const normalizeEmailForGuestToken = email => {
  return email.trim().toLowerCase();
};

/**
 * Returns all emails that were used to contribute as guest on this browser
 */
export const getAllGuestEmails = () => {
  const guestTokens = getAllGuestTokens();
  const normalizedEntries = Object.entries(guestTokens).map(([key, value]) => normalizeGuestToken(key, value));
  const emails = normalizedEntries.map(e => e.email);
  return uniq(emails);
};

export const removeGuestTokens = (emails = [], tokens = []) => {
  const allTokens = getAllGuestTokens();
  const normalizedEmails = emails?.map(normalizeEmailForGuestToken);
  const newTokens = omitBy(allTokens, (value, key) => {
    const { email, token } = normalizeGuestToken(key, value);
    if (normalizedEmails && normalizedEmails.includes(email)) {
      return true;
    } else if (tokens && tokens.includes(token)) {
      return true;
    } else {
      return false;
    }
  });

  setLocalStorage(LOCAL_STORAGE_KEYS.GUEST_TOKENS, JSON.stringify(newTokens));
};

export const setGuestToken = (email, orderId, token) => {
  const tokens = { ...getAllGuestTokens(), [orderId]: { token, email: normalizeEmailForGuestToken(email) } };
  setLocalStorage(LOCAL_STORAGE_KEYS.GUEST_TOKENS, JSON.stringify(tokens));
};
