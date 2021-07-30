import 'jest-styled-components';

import React from 'react';
import { ThemeProvider } from 'styled-components';

import theme from '../../lib/theme';
import { snapshot } from '../../test/snapshot-helpers';

import TruncatedTextWithTooltip from '../TruncatedTextWithTooltip';

describe('TruncatedTextWithTooltip component', () => {
  it('renders default options', () => {
    snapshot(
      <ThemeProvider theme={theme}>
        <TruncatedTextWithTooltip value="A short string" />
      </ThemeProvider>,
    );
  });

  it('renders default options', () => {
    snapshot(
      <ThemeProvider theme={theme}>
        <TruncatedTextWithTooltip value="a string that is more than 30 characters long" />
      </ThemeProvider>,
    );
  });
});
