import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { ACTIVITIES_INFO } from './activity-helpers';

const renderDetails = (data: Record<string, unknown>) =>
  render(
    <IntlProvider locale="en">
      <div>{ACTIVITIES_INFO.COLLECTIVE_EXPENSE_ERROR.renderDetails(data)}</div>
    </IntlProvider>,
  );

describe('COLLECTIVE_EXPENSE_ERROR activity', () => {
  it('renders the error summary derived from the stored provider event', () => {
    renderDetails({ error: { name: 'transfers#state-change', message: 'Wise transfer cancelled' } });

    expect(screen.getByText('Wise transfer cancelled')).toBeInTheDocument();
    expect(screen.queryByText('An unknown error occurred')).not.toBeInTheDocument();
  });

  it('lists the error details', () => {
    renderDetails({
      error: {
        name: 'RECEIVER_COUNTRY_NOT_ALLOWED',
        message: 'The receiver country is not allowed.',
        details: [{ issue: 'RECEIVER_COUNTRY_NOT_ALLOWED' }, { issue: 'AMOUNT_INVALID' }],
      },
    });

    expect(screen.getByText('The receiver country is not allowed.')).toBeInTheDocument();
    expect(screen.getByText('RECEIVER_COUNTRY_NOT_ALLOWED')).toBeInTheDocument();
    expect(screen.getByText('AMOUNT_INVALID')).toBeInTheDocument();
  });

  it('renders the error name when the summary has no message', () => {
    renderDetails({ error: { name: 'transfers#refund' } });

    expect(screen.getByText('transfers#refund')).toBeInTheDocument();
    expect(screen.queryByText('An unknown error occurred')).not.toBeInTheDocument();
  });

  it('falls back to the generic message when there is no summary at all', () => {
    renderDetails({});

    expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
  });
});
