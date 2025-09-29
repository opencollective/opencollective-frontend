import type { Preview } from '@storybook/nextjs-vite';
import { ThemeProvider } from 'styled-components';
import React from 'react';
import { IntlProvider } from 'react-intl';

// Import global styles
import '../public/static/styles/app.css';
import '../lib/dayjs';
import theme from '../lib/theme';

// Import English messages for Storybook
import enMessages from '../lang/en.json';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  decorators: [
    Story =>
      React.createElement(
        IntlProvider,
        { locale: 'en', defaultLocale: 'en', messages: enMessages },
        React.createElement(
          ThemeProvider,
          { theme },
          React.createElement('div', { className: 'font-sans' }, React.createElement(Story)),
        ),
      ),
  ],
};

export default preview;
