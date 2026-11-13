import React from 'react';
import { ThemeProvider } from 'styled-components';

import { useIsDarkModeActive } from '../lib/hooks/useDashboardTheme';
import theme, { darkTheme } from '../lib/theme';

/**
 * Provides the theme to legacy styled-components, switching to the dark variant when dark mode is applied to the
 * document (dashboard only, see `useApplyDashboardTheme`).
 */
export default function StyledThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useIsDarkModeActive();
  return <ThemeProvider theme={isDark ? darkTheme : theme}>{children}</ThemeProvider>;
}
