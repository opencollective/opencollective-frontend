import '@testing-library/jest-dom';

import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../../lib/theme';

import MoveReceivedContributions from './MoveReceivedContributions';

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('../CollectivePickerAsync', () => ({
  __esModule: true,
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange({ value: { id: 1, slug: 'test', name: 'Test' } })}>
      pick account
    </button>
  ),
}));

jest.mock('../OrdersPickerAsync', () => ({
  __esModule: true,
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange([{ value: { id: 2, legacyId: 2 } }])}>
      pick contributions
    </button>
  ),
}));

jest.mock('../ConfirmationModal', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../dashboard/DashboardHeader', () => ({ __esModule: true, default: () => null }));

jest.mock('../ui/useToast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

const renderWithIntl = ui =>
  render(
    <IntlProvider locale="en">
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </IntlProvider>,
  );

describe('MoveReceivedContributions', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        account: {
          id: 1,
          settings: {},
          tiers: { nodes: [{ id: 10, legacyId: 10, slug: 'backer', name: 'Backer' }] },
        },
      },
      loading: false,
    });
    (useMutation as jest.Mock).mockReturnValue([jest.fn(), { loading: false }]);
  });

  it('does not select a malformed tier option when "custom contribution" is chosen', () => {
    renderWithIntl(<MoveReceivedContributions />);

    fireEvent.click(screen.getByRole('button', { name: 'pick account' }));
    fireEvent.click(screen.getByRole('button', { name: 'pick contributions' }));

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Custom contribution'));

    expect(screen.queryByText('#undefined - undefined')).not.toBeInTheDocument();
  });
});
