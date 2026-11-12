import React from 'react';
import { render } from '@testing-library/react';

import { withRequiredProviders } from '../../../../test/providers';

import ActivityTypeFilter from './ActivityTypeFilter';

// The filter renders its option groups through react-select; expose them directly to assert their content.
jest.mock('../../../StyledSelectFilter', () => ({
  StyledSelectFilter: ({ options }: { options: unknown }) => JSON.stringify(options),
}));

const renderOptions = () => {
  const { container } = render(
    withRequiredProviders(
      <ActivityTypeFilter
        account={{ slug: 'acme', type: 'COLLECTIVE', isHost: true }}
        onChange={jest.fn()}
        value={null}
      />,
    ),
  );
  return JSON.parse(container.textContent);
};

describe('ActivityTypeFilter', () => {
  it('lists the expense payment error type under expenses', () => {
    const expensesGroup = renderOptions().find(group => group.label === 'Expenses');

    expect(expensesGroup.options).toEqual(
      expect.arrayContaining([{ label: 'Expense payment error', value: 'COLLECTIVE_EXPENSE_PAYMENT_ERROR' }]),
    );
  });

  it('keeps the expense error type next to it', () => {
    const expensesGroup = renderOptions().find(group => group.label === 'Expenses');

    expect(expensesGroup.options).toEqual(
      expect.arrayContaining([{ label: 'Expense error', value: 'COLLECTIVE_EXPENSE_ERROR' }]),
    );
  });
});
