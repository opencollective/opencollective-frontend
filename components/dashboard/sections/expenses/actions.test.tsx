import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withRequiredProviders } from '../../../../test/providers';

import { DuplicateExpenseFlowWrapper } from './actions';

const mockOnClose = jest.fn();

jest.mock('../../../submit-expense/SubmitExpenseFlow', () => ({
  SubmitExpenseFlow: ({ onClose }) => {
    mockOnClose.mockImplementation(onClose);
    return (
      <button type="button" onClick={() => onClose(true, false)}>
        complete-submit
      </button>
    );
  },
}));

describe('DuplicateExpenseFlowWrapper', () => {
  it('calls onSuccess after a duplicated expense is submitted', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const setOpen = jest.fn();

    render(
      withRequiredProviders(
        <DuplicateExpenseFlowWrapper open setOpen={setOpen} expenseId={42} onSuccess={onSuccess} />,
      ),
    );

    await user.click(await screen.findByRole('button', { name: 'complete-submit' }));

    expect(setOpen).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });
});
