/**
 * A map of keys used for local storage.
 */
export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  LOGGED_IN_USER: 'LoggedInUser',
  HOST_DASHBOARD_FILTER_PREFERENCES: 'hostDashBoardFilterPreferences',
};

/**
 * Helper to check if localStorage is supported in current context
 */
export const hasLocalStorage = () => {
  return Boolean(typeof window !== 'undefined' && window.localStorage);
};

/**
 * A helper to get a value from localStorage that returns null instead of crashing
 * if localStorage doesn't exist. This is useful for:
 *  - SSR, because localStorage doesn't exist in this context
 *  - Because robots/crawlers (like Google) don't have it and we don't want to crash when they visit us
 */
export const getFromLocalStorage = key => {
  if (hasLocalStorage()) {
    return window.localStorage.getItem(key);
  } else {
    return null;
  }
};

/**
 * A helper to set a value in localStorage that doesn't crash if localStorage doesn't exist.
 * This is useful for:
 *  - SSR, because localStorage doesn't exist in this context
 *  - Because robots/crawlers (like Google) don't have it and we don't want to crash when they visit us
 */
export const setLocalStorage = (key, value) => {
  if (hasLocalStorage()) {
    return window.localStorage.setItem(key, value);
  }
};

/**
 * A helper to remove an entry in localStorage that doesn't crash if localStorage doesn't exist.
 * This is useful for:
 *  - SSR, because localStorage doesn't exist in this context
 *  - Because robots/crawlers (like Google) don't have it and we don't want to crash when they visit us
 */
export const removeFromLocalStorage = key => {
  if (hasLocalStorage()) {
    return window.localStorage.removeItem(key);
  }
};
