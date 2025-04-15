/**
 * A map of keys used for local storage.
 */
export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  TWO_FACTOR_AUTH_TOKEN: 'twoFactorAuthToken',
  GUEST_TOKENS: 'guestTokens',
  HOST_DASHBOARD_FILTER_PREFERENCES: 'hostDashBoardFilterPreferences',
  LAST_DASHBOARD_SLUG: 'lastDashboardSlug',
  DASHBOARD_NAVIGATION_STATE: 'DashboardNavigationState',
  PREFERRED_TWO_FACTOR_METHOD: 'preferredTwoFactorMethod',
  UPDATES_FORM_STATE: 'updatesFormState',
  RECENTLY_VISITED: 'recentlyVisited',
  PLAID_LINK_TOKEN: 'plaidLinkToken',
};

// The below helpers use a try-catch to gracefully fallback in these scenarios:
// - SSR (server-side rendering), where the emulated context might not have localStorage.
// - Some robots and crawlers (like Google), although these usually either don't execute JS,
//   or do so in a modern engine with supported (but ignored) localStorage.
// - Private browsing mode. Here, localStorage methods may throw exceptions.
// - Regular browsing mode, if the user configured the browser to require permission before
//   storing data. If the current site isn't yet whitelisted and JS attempts to access
//   window.localStorage, an exception is thrown. Even `if (window.localStorage)` crashes.
// - Regular browsing mode, where localStorage is full. In those cases, localStorage.setItem()
//   will throw an exception.

/**
 * A helper to get a value from localStorage.
 * Returns the value, or null if no value exists or if storage is unavailable.
 */
export const getFromLocalStorage = (key: string): string => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * A helper to set a value in localStorage.
 * Ignores errors about full, disallowed or unsupported storage.
 */
export const setLocalStorage = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore errors
  }
};

/**
 * A helper to remove an entry in localStorage.
 * Ignores errors about full, disallowed or unsupported storage.
 */
export const removeFromLocalStorage = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
};
