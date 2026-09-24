import React from 'react';

import { ExpenseInviteRecipientNote } from '@/components/expenses/ExpenseInviteWelcome';
import type { ExpenseForm } from '@/components/submit-expense/useExpenseForm';

export function InvitationNoteSection(props: { form: ExpenseForm }) {
  return <ExpenseInviteRecipientNote expense={props.form.options.expense} />;
}
