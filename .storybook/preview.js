import { ThemeProvider } from 'styled-components';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { IntlProvider } from 'react-intl';
import theme from '../lib/theme';
import { ApolloProvider } from '@apollo/client';
import * as nextImage from 'next/image';

import UserProvider from '../components/UserProvider';
import { initClient } from '../lib/apollo-client';
import { withDesign } from 'storybook-addon-designs';

import 'nprogress/nprogress.css';
import 'trix/dist/trix.css';
import '../public/static/styles/app.css';
import { WithNextRouter } from 'storybook-addon-next-router/dist/decorators';
import ToastProvider from '../components/ToastProvider';

Object.defineProperty(nextImage, 'default', {
  configurable: true,
  value: props => <img {...props} />,
});

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  nextRouter: {
    Provider: RouterContext.Provider,
  },
};

export const decorators = [
  Story => (
    <ApolloProvider client={initClient()}>
      <ThemeProvider theme={theme}>
        <IntlProvider locale="en">
          <UserProvider>
            <ToastProvider>
              <Story />
            </ToastProvider>
          </UserProvider>
        </IntlProvider>
      </ThemeProvider>
    </ApolloProvider>
  ),
  withDesign,
  WithNextRouter,
];
