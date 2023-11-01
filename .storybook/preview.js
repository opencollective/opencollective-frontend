import { ThemeProvider } from 'styled-components';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { IntlProvider } from 'react-intl';
import theme from '../lib/theme';
import { ApolloProvider } from '@apollo/client';

import UserProvider from '../components/UserProvider';
import { initClient } from '../lib/apollo-client';
import { withDesign } from 'storybook-addon-designs';

import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'nprogress/nprogress.css';
import 'trix/dist/trix.css';
import '../public/static/styles/app.css';
import { TooltipProvider } from '../components/ui/Tooltip';
import { Toaster } from '../components/ui/Toaster';

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
            <TooltipProvider>
              <Story />
              <Toaster />
            </TooltipProvider>
          </UserProvider>
        </IntlProvider>
      </ThemeProvider>
    </ApolloProvider>
  ),
  withDesign,
];
