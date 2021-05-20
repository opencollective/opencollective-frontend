import { ThemeProvider } from 'styled-components';
import { IntlProvider } from 'react-intl';
import theme from '../lib/theme';

import 'nprogress/nprogress.css';
import 'react-datetime/css/react-datetime.css';
import 'trix/dist/trix.css';
import '../public/static/styles/app.css';

export const decorators = [
  Story => (
    <ThemeProvider theme={theme}>
      <IntlProvider locale="en">
        <Story />
      </IntlProvider>
    </ThemeProvider>
  ),
];
