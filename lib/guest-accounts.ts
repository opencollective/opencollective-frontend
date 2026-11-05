import { omitBy } from 'lodash-es';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from './local-storage';

/**
 * Returns a map like { [email]: token }
 */
const getAllGuestTokens = (): Record<string, unknown> => {
  try {
    const localStorageValue = getFromLocalStorage(LOCAL_STORAGE_KEYS.GUEST_TOKENS);
    return JSON.parse(localStorageValue) || {};
  } catch {
    return {};
  }
};

const normalizeGuestToken = (key: string, value): { email: string; token: string; orderId?: string } => {
  if (typeof value === 'string') {
    return { email: key, token: value };
  } else {
    return { email: value.email, token: value.email, orderId: key };
  }
};

const normalizeEmailForGuestToken = (email: string): string => {
  return email.trim().toLowerCase();
};

export const removeGuestTokens = (emails: string[] = [], tokens: string[] = []): void => {
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

export const setGuestToken = (email: string, orderId: string, token: string): void => {
  const tokens = { ...getAllGuestTokens(), [orderId]: { token, email: normalizeEmailForGuestToken(email) } };
  setLocalStorage(LOCAL_STORAGE_KEYS.GUEST_TOKENS, JSON.stringify(tokens));
};
