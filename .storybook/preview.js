import { ThemeProvider } from 'styled-components';
import { IntlProvider } from 'react-intl';
import theme from '../lib/theme';

export const decorators = [
  Story => (
    <ThemeProvider theme={theme}>
      <IntlProvider locale="en">
        <Story />
      </IntlProvider>
    </ThemeProvider>
  ),
];
