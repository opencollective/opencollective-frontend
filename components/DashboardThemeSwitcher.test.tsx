import '@testing-library/jest-dom';

jest.mock('../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import React from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import { useApplyDashboardTheme } from '../lib/hooks/useDashboardTheme';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { LOCAL_STORAGE_KEYS } from '../lib/local-storage';

import { TooltipProvider } from './ui/Tooltip';
import { DashboardThemeSwitcher } from './DashboardThemeSwitcher';

const mockLoggedInUser = ({ darkModeEnabled, loading = false }: { darkModeEnabled: boolean; loading?: boolean }) => {
  (useLoggedInUser as jest.Mock).mockReturnValue({
    loadingLoggedInUser: loading,
    LoggedInUser: { hasPreviewFeatureEnabled: (key: string) => key === 'DARK_MODE' && darkModeEnabled },
  });
};

const mockSystemPreference = (prefersDark: boolean) => {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: prefersDark && query === '(prefers-color-scheme: dark)',
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
};

const renderSwitcher = (props = {}) =>
  render(
    <IntlProvider locale="en">
      <TooltipProvider>
        <DashboardThemeSwitcher {...props} />
      </TooltipProvider>
    </IntlProvider>,
  );

describe('Dashboard theme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockSystemPreference(false);
  });

  describe('DashboardThemeSwitcher', () => {
    it('renders nothing when the dark mode preview feature is disabled', () => {
      mockLoggedInUser({ darkModeEnabled: false });
      const { container } = renderSwitcher();
      expect(container).toBeEmptyDOMElement();
    });

    it('defaults to Auto and persists the selected preference', async () => {
      mockLoggedInUser({ darkModeEnabled: true });
      renderSwitcher({ showLabels: true });
      expect(screen.getByRole('radio', { name: 'Auto' })).toBeChecked();

      await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
      expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEYS.DASHBOARD_THEME)).toBe('dark');
    });
  });

  describe('useApplyDashboardTheme', () => {
    it('applies the dark class when the preference is dark', () => {
      mockLoggedInUser({ darkModeEnabled: true });
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.DASHBOARD_THEME, 'dark');
      const { result, unmount } = renderHook(() => useApplyDashboardTheme());
      expect(result.current).toBe('dark');
      expect(document.documentElement).toHaveClass('dark');
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEYS.DASHBOARD_DARK_MODE_ENABLED)).toBe('true');

      // Leaving the dashboard resets the theme
      unmount();
      expect(document.documentElement).not.toHaveClass('dark');
    });

    it('follows the system preference by default', () => {
      mockLoggedInUser({ darkModeEnabled: true });
      mockSystemPreference(true);
      const { result } = renderHook(() => useApplyDashboardTheme());
      expect(result.current).toBe('dark');
      expect(document.documentElement).toHaveClass('dark');
    });

    it('always uses the light theme when the preview feature is disabled', () => {
      mockLoggedInUser({ darkModeEnabled: false });
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.DASHBOARD_THEME, 'dark');
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.DASHBOARD_DARK_MODE_ENABLED, 'true');
      const { result } = renderHook(() => useApplyDashboardTheme());
      expect(result.current).toBe('light');
      expect(document.documentElement).not.toHaveClass('dark');
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEYS.DASHBOARD_DARK_MODE_ENABLED)).toBeNull();
    });

    it('keeps the theme applied before hydration while the user is loading', () => {
      mockLoggedInUser({ darkModeEnabled: false, loading: true });
      document.documentElement.classList.add('dark');
      renderHook(() => useApplyDashboardTheme());
      expect(document.documentElement).toHaveClass('dark');
    });

    it('updates when the preference changes', () => {
      mockLoggedInUser({ darkModeEnabled: true });
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.DASHBOARD_THEME, 'light');
      renderHook(() => useApplyDashboardTheme());
      expect(document.documentElement).not.toHaveClass('dark');
      act(() => {
        window.localStorage.setItem(LOCAL_STORAGE_KEYS.DASHBOARD_THEME, 'dark');
        window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_STORAGE_KEYS.DASHBOARD_THEME }));
      });
      expect(document.documentElement).toHaveClass('dark');
    });
  });
});
