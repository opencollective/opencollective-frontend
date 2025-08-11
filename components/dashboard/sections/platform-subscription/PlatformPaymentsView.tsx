import React from 'react';
import { take } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { ExpensesListFieldsFragmentFragment } from '@/lib/graphql/types/v2/graphql';

import DateTime from '@/components/DateTime';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

type PlatformPaymentsViewProps = {
  expenses: ExpensesListFieldsFragmentFragment[];
};

export function PlatformPaymentsView(props: PlatformPaymentsViewProps) {
  const [inViewCount, setInViewCount] = React.useState(5);
  const [openExpenseId, setOpenExpenseId] = React.useState(null);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <FormattedMessage defaultMessage="Date" id="expense.incurredAt" />
            </TableHead>
            <TableHead>
              <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
            </TableHead>
            <TableHead>
              <FormattedMessage defaultMessage="Description" id="Fields.description" />
            </TableHead>
            <TableHead>
              <FormattedMessage defaultMessage="Status" id="tzMNF3" />
            </TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {take(props.expenses, inViewCount).map(expense => (
            <TableRow className="last:border-b-0" key={expense.id} onClick={() => setOpenExpenseId(expense.legacyId)}>
              <TableCell>
                <DateTime value={expense.createdAt} />
              </TableCell>
              <TableCell>
                <FormattedMoneyAmount amount={expense.amount} currency={expense.currency} />
              </TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>
                <div className="flex">
                  <ExpenseStatusTag status={expense.status} />
                </div>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {inViewCount < props.expenses.length && (
        <div className="mt-2">
          <Button variant="outline" className="w-full" onClick={() => setInViewCount(count => count + 5)}>
            <FormattedMessage defaultMessage="View more" id="34Up+l" />
            &nbsp;
            <ChevronDown />
          </Button>
        </div>
      )}
      <ExpenseDrawer openExpenseLegacyId={openExpenseId} handleClose={() => setOpenExpenseId(null)} />
    </div>
  );
}
