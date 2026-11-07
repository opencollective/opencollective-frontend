import '@testing-library/jest-dom';

const mockContext = { current: { LoggedInUser: null } };

jest.mock('../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => mockContext.current,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../lib/theme';

import GlobalWarnings from './GlobalWarnings';

const renderWarnings = () =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <ThemeProvider theme={theme}>
        <GlobalWarnings />
      </ThemeProvider>
    </IntlProvider>,
  );

describe('GlobalWarnings', () => {
  it('renders the limited account warning', () => {
    mockContext.current = { LoggedInUser: { isLimited: true, isHostAdmin: () => false } };

    renderWarnings();

    expect(screen.getByText(/currently limited/i)).toBeInTheDocument();
  });

  it('renders nothing for a regular account', () => {
    mockContext.current = { LoggedInUser: { isLimited: false, isHostAdmin: () => false } };

    const { container } = renderWarnings();

    expect(container).toBeEmptyDOMElement();
  });
});
