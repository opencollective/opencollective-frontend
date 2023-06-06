import { ThemeProvider, createGlobalStyle, css } from 'styled-components';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { IntlProvider } from 'react-intl';
import theme from '../lib/theme';
import { ApolloProvider } from '@apollo/client';
import * as nextImage from 'next/image';

import UserProvider from '../components/UserProvider';
import { initClient } from '../lib/apollo-client';
import { withDesign } from 'storybook-addon-designs';

import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'nprogress/nprogress.css';
import 'trix/dist/trix.css';
import '../public/static/styles/app.css';
import ToastProvider from '../components/ToastProvider';
import { parseToBoolean } from '../lib/utils';

const MUST_DISABLE_ANIMATIONS = parseToBoolean(process.env.STORYBOOK_DISABLE_CSS_ANIMATIONS);

const ControlAnimations = createGlobalStyle`
  ${({ disable }) =>
    disable &&
    css`
      * {
        animation-play-state: paused !important;
      }
    `}
`;

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
              <ControlAnimations disable={MUST_DISABLE_ANIMATIONS} />
              <Story />
            </ToastProvider>
          </UserProvider>
        </IntlProvider>
      </ThemeProvider>
    </ApolloProvider>
  ),
  withDesign,
];
