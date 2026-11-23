import React from 'react';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS, removeFromLocalStorage, setLocalStorage } from '../local-storage';
import { PREVIEW_FEATURE_KEYS } from '../preview-features';

import useLoggedInUser from './useLoggedInUser';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

// ---- Preference store (localStorage, per device, synced across tabs) ----

const listeners = new Set<() => void>();

const subscribeToPreference = (callback: () => void) => {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_KEYS.DASHBOARD_THEME) {
      currentPreference = readStoredPreference();
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
    if (listeners.size === 0) {
      currentPreference = null; // Re-read from storage on next use
    }
  };
};

const readStoredPreference = (): ThemePreference => {
  const value = getFromLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_THEME) as ThemePreference;
  return THEME_PREFERENCES.includes(value) ? value : 'system';
};

// In-memory snapshot, so that the selection still applies when localStorage is unavailable (persistence is best effort)
let currentPreference: ThemePreference | null = null;

const getPreference = (): ThemePreference => {
  if (currentPreference === null) {
    currentPreference = readStoredPreference();
  }
  return currentPreference;
};

const setPreference = (preference: ThemePreference) => {
  currentPreference = preference;
  setLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_THEME, preference);
  listeners.forEach(listener => listener());
};

// ---- System preference ----

const subscribeToSystemTheme = (callback: () => void) => {
  const mediaQuery = window.matchMedia?.(DARK_MEDIA_QUERY);
  mediaQuery?.addEventListener('change', callback);
  return () => mediaQuery?.removeEventListener('change', callback);
};

const getSystemPrefersDark = () => Boolean(window.matchMedia?.(DARK_MEDIA_QUERY).matches);

// ---- DOM ----

/**
 * Toggles the `dark` class on <html>. Transitions are disabled while switching to prevent elements
 * from animating their colors one after the other.
 */
const setDarkClass = (isDark: boolean) => {
  const root = document.documentElement;
  if (root.classList.contains('dark') === isDark) {
    return;
  }

  const style = document.createElement('style');
  style.appendChild(document.createTextNode('*,*::before,*::after{transition:none!important}'));
  document.head.appendChild(style);
  root.classList.toggle('dark', isDark);
  window.getComputedStyle(document.body).getPropertyValue('opacity'); // Force a reflow before re-enabling transitions
  setTimeout(() => style.remove(), 1);
};

/**
 * Script injected in the document <head> to apply the theme before the first paint, preventing a flash
 * of the light theme while the logged-in user is loading. Must be kept in sync with `useApplyDashboardTheme`.
 */
export const DASHBOARD_THEME_INIT_SCRIPT = `(function(){try{if(!/^\\/dashboard(\\/|$)/.test(location.pathname)||localStorage.getItem('${LOCAL_STORAGE_KEYS.DASHBOARD_DARK_MODE_ENABLED}')!=='true')return;var t=localStorage.getItem('${LOCAL_STORAGE_KEYS.DASHBOARD_THEME}');if(t==='dark'||(t!=='light'&&window.matchMedia('${DARK_MEDIA_QUERY}').matches))document.documentElement.classList.add('dark')}catch(e){}})();`;

// ---- Hooks ----

const subscribeToDarkClass = (callback: () => void) => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};

/**
 * Whether dark mode is currently applied to the document. Use this rather than `useDashboardTheme` for styling
 * decisions, as it also covers the components rendered outside of the dashboard tree (e.g. modals).
 */
export const useIsDarkModeActive = () =>
  React.useSyncExternalStore(
    subscribeToDarkClass,
    () => document.documentElement.classList.contains('dark'),
    () => false,
  );

/**
 * The dashboard theme preference (Auto/Light/Dark). Dark mode is a preview feature: when it's not enabled,
 * the resolved theme is always `light`.
 */
export const useDashboardTheme = () => {
  const { LoggedInUser } = useLoggedInUser();
  const isAvailable = Boolean(LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DARK_MODE));
  const preference = React.useSyncExternalStore(subscribeToPreference, getPreference, () => 'system' as const);
  const systemPrefersDark = React.useSyncExternalStore(subscribeToSystemTheme, getSystemPrefersDark, () => false);
  const isDark = isAvailable && (preference === 'dark' || (preference === 'system' && systemPrefersDark));
  return { isAvailable, preference, setPreference, resolvedTheme: isDark ? ('dark' as const) : ('light' as const) };
};

/**
 * Applies the dashboard theme to the document. Must be mounted once, at the root of the dashboard: the theme
 * is reset to light when the component unmounts (e.g. when navigating to a public page).
 */
export const useApplyDashboardTheme = () => {
  const { loadingLoggedInUser } = useLoggedInUser();
  const { isAvailable, resolvedTheme } = useDashboardTheme();

  React.useEffect(() => {
    // While the user is loading, keep the theme applied by `DASHBOARD_THEME_INIT_SCRIPT`
    if (loadingLoggedInUser) {
      return;
    }

    setDarkClass(resolvedTheme === 'dark');
    if (isAvailable) {
      setLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_DARK_MODE_ENABLED, 'true');
    } else {
      removeFromLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_DARK_MODE_ENABLED);
    }
  }, [loadingLoggedInUser, isAvailable, resolvedTheme]);

  React.useEffect(() => () => setDarkClass(false), []);

  return resolvedTheme;
};
