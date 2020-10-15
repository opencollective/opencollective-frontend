import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from './local-storage';

const getTokensMap = () => {
  try {
    const localStorageValue = getFromLocalStorage(LOCAL_STORAGE_KEYS.GUEST_TOKENS);
    return JSON.parse(localStorageValue) || {};
  } catch (e) {
    return {};
  }
};

export const getGuestToken = email => {
  const tokens = getTokensMap();
  return tokens[email] ?? null;
};

export const setGuestToken = (email, token) => {
  const tokens = { ...getTokensMap(), [email]: token };
  setLocalStorage(LOCAL_STORAGE_KEYS.GUEST_TOKENS, JSON.stringify(tokens));
};
