import React from 'react';
import { render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../test/providers';

import ExpenseInviteWelcome from './ExpenseInviteWelcome';

const baseExpense = {
  id: 'expense-id',
  legacyId: 42,
  createdAt: new Date('2026-01-01'),
  createdByAccount: {
    id: 'account-id',
    legacyId: 1,
    slug: 'inviter',
    name: 'Inviter',
    type: 'INDIVIDUAL',
  },
  permissions: {
    canDeclineExpenseInvite: false,
  },
} as unknown as React.ComponentProps<typeof ExpenseInviteWelcome>['expense'];

describe('ExpenseInviteWelcome', () => {
  it('shows the continue button even when the draft has no recipient note', () => {
    render(
      withRequiredProviders(
        <ExpenseInviteWelcome expense={baseExpense} draftKey="draft-key" onContinueSubmissionClick={jest.fn()} />,
      ),
    );

    expect(screen.getByRole('button', { name: /continue submission/i })).toBeInTheDocument();
  });

  it('shows the recipient note when the draft has one', () => {
    render(
      withRequiredProviders(
        <ExpenseInviteWelcome
          expense={{ ...baseExpense, draft: { recipientNote: 'Please fill in your payout details' } }}
          draftKey="draft-key"
          onContinueSubmissionClick={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText('Please fill in your payout details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue submission/i })).toBeInTheDocument();
  });
});
