import '@testing-library/jest-dom';

import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../../../../lib/theme';

import NotificationsSettings from './index';

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ query: {}, asPath: '/dashboard/test/notifications' }),
}));

jest.mock('../../../ui/Tooltip', () => ({
  Tooltip: ({ children }) => children,
  TooltipTrigger: ({ children }) => children,
  TooltipContent: ({ children }) => children,
}));

const renderWithProviders = ui =>
  render(
    <IntlProvider locale="en">
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </IntlProvider>,
  );

describe('NotificationsSettings', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        account: {
          id: 'account-1',
          newsletterOptIn: false,
          memberOf: { nodes: [] },
          backerOf: { nodes: [] },
        },
      },
      loading: false,
      error: undefined,
    });
    (useMutation as jest.Mock).mockReturnValue([jest.fn(), { loading: true }]);
  });

  it('disables the newsletter switch while it is being saved', () => {
    renderWithProviders(<NotificationsSettings accountSlug="test" subpath={[]} />);

    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
