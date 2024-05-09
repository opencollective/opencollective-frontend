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
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
    // Ignore errors
  }
};

/**
 * Store a value in localStorage with a time-to-live (TTL).
 */
export const setLocalStorageWithTTL = (key: string, value: Object | string | number, ttl = 1000 * 60 * 60) => {
  if (!value) {
    return removeFromLocalStorage(key);
  }
  const expire = new Date(Date.now() + ttl).getTime();
  setLocalStorage(key, JSON.stringify({ timestamp: new Date().getTime(), expire, value }));
};

/**
 * Retrieve a value from localStorage with a time-to-live (TTL).
 */
export const getFromLocalStorageWithTTL = (key: string) => {
  const entry = getFromLocalStorage(key);
  if (!entry) {
    return;
  }
  try {
    const obj = JSON.parse(entry);
    if (Number(obj.expire) < Date.now()) {
      // eslint-disable-next-line no-console
      console.error('>>> entry for ', key, 'has expired');
      return;
    }
    return obj.value;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('>>> unable to parse entry for ', key, 'entry: ', entry);
    return;
  }
};
