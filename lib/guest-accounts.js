import { omitBy } from 'lodash';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from './local-storage';

/**
 * Returns a map like { [email]: token }
 */
export const getAllGuestTokens = () => {
  try {
    const localStorageValue = getFromLocalStorage(LOCAL_STORAGE_KEYS.GUEST_TOKENS);
    return JSON.parse(localStorageValue) || {};
  } catch (e) {
    return {};
  }
};

export const normalizeEmailForGuestToken = email => {
  return email.trim().toLowerCase();
};

export const removeGuestTokens = (emails = [], tokens = []) => {
  const allTokens = getAllGuestTokens();
  const normalizedEmails = emails?.map(normalizeEmailForGuestToken);
  const newTokens = omitBy(allTokens, (token, email) => {
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

export const getGuestToken = email => {
  const tokens = getAllGuestTokens();
  return tokens[normalizeEmailForGuestToken(email)] ?? null;
};

export const setGuestToken = (email, token) => {
  const tokens = { ...getAllGuestTokens(), [normalizeEmailForGuestToken(email)]: token };
  setLocalStorage(LOCAL_STORAGE_KEYS.GUEST_TOKENS, JSON.stringify(tokens));
};
