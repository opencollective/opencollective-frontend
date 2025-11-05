import type { Preview } from '@storybook/nextjs-vite';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import React from 'react';
import { IntlProvider } from 'react-intl';
import isPropValid from '@emotion/is-prop-valid';
import { MockedProvider } from '@apollo/client/testing';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';

// Import global styles
import '../public/static/styles/app.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'nprogress/nprogress.css';
import 'trix/dist/trix.css';
import '../lib/dayjs';
import theme from '../lib/theme';

// Import English messages for Storybook
import enMessages from '../lang/en.json';

// Import UI components
import { TooltipProvider } from '../components/ui/Tooltip';
import { Toaster } from '../components/ui/Toaster';
import { UserContext } from '../components/UserProvider';

// Mock UserContext for Storybook
const mockUserContext = {
  loadingLoggedInUser: false,
  errorLoggedInUser: null,
  LoggedInUser: null,
  logout: async () => null,
  login: async () => null,
  async refetchLoggedInUser() {},
  updateLoggedInUserFromCache: () => {},
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextRouter: {
      Provider: RouterContext.Provider,
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
        MockedProvider,
        { addTypename: false, mocks: [] },
        React.createElement(
          IntlProvider,
          { locale: 'en', defaultLocale: 'en', messages: enMessages },
          React.createElement(
            StyleSheetManager,
            {
              shouldForwardProp: (propName, elementToBeRendered) => {
                // Forward all props for custom components (string checks for HTML elements)
                if (typeof elementToBeRendered === 'string') {
                  // For HTML elements, use isPropValid to filter out style props
                  return isPropValid(propName);
                }
                // For custom components, forward all props
                return true;
              },
            },
            React.createElement(
              ThemeProvider,
              { theme },
              React.createElement(
                UserContext.Provider,
                { value: mockUserContext },
                React.createElement(
                  TooltipProvider,
                  null,
                  React.createElement(
                    'div',
                    { className: 'font-sans' },
                    React.createElement(Story),
                    React.createElement(Toaster),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
  ],
};

export default preview;
