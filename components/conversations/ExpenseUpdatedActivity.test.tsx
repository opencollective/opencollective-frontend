import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { ACTIVITIES_INFO, getActivityMessage } from './activity-helpers';

const renderDetails = data =>
  render(
    <IntlProvider locale="en">
      <div>{ACTIVITIES_INFO.COLLECTIVE_EXPENSE_UPDATED.renderDetails(data)}</div>
    </IntlProvider>,
  );

const getTitle = data => getActivityMessage({ type: 'COLLECTIVE_EXPENSE_UPDATED', data })?.defaultMessage;

const bankAccount = (id, city, accountNumber) => ({
  id,
  type: 'BANK_ACCOUNT',
  name: 'Checking',
  currency: 'USD',
  data: { accountHolderName: 'Jamie', details: { accountNumber, address: { city } } },
});

describe('COLLECTIVE_EXPENSE_UPDATED activity', () => {
  it('describes tax form status changes', () => {
    const data = {
      isSystem: true,
      previousData: { taxFormStatus: 'REQUESTED' },
      newData: { taxFormStatus: 'RECEIVED' },
      taxForm: { year: 2026 },
    };
    expect(getTitle(data)).toBe('Tax form received');
    renderDetails(data);
    expect(screen.getByText(/2026 tax form status changed from/)).toBeInTheDocument();
    expect(screen.getByText('Requested')).toBeInTheDocument();
    expect(screen.getByText('Received')).toBeInTheDocument();
  });

  it('lists the payout method fields that changed', () => {
    const data = {
      isSystem: true,
      previousData: { payoutMethod: bankAccount(1, 'New York', '1234') },
      newData: { payoutMethod: bankAccount(2, 'Brooklyn', '5678') },
    };
    expect(getTitle(data)).toBe('Payout method replaced');
    renderDetails(data);
    expect(screen.getByText(/This expense now uses the new details/)).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('Brooklyn')).toBeInTheDocument();
    expect(screen.queryByText('Jamie')).not.toBeInTheDocument(); // Unchanged fields are not listed
  });

  it('explains when the expense keeps the archived payout method', () => {
    const data = {
      isSystem: true,
      previousData: { payoutMethod: bankAccount(1, 'New York', '1234') },
      newData: { payoutMethod: { id: 2, type: 'BANK_ACCOUNT' } },
    };
    renderDetails(data);
    expect(screen.getByText(/This expense still uses the previous details/)).toBeInTheDocument();
  });

  it('shows nothing misleading when details are hidden from the user', () => {
    const data = { isSystem: true, expense: { status: 'PENDING' } };
    expect(getTitle(data)).toBe('Expense updated');
    expect(ACTIVITIES_INFO.COLLECTIVE_EXPENSE_UPDATED.renderDetails(data)).toBeNull();
  });

  it('still flags re-submitted expenses', () => {
    const data = { previousData: { status: 'INCOMPLETE' }, expense: { status: 'PENDING' } };
    expect(getTitle(data)).toBe('Expense updated');
    renderDetails(data);
    expect(screen.getByText(/re-submitted for approval/)).toBeInTheDocument();
  });
});
