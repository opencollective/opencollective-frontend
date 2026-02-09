import React from 'react';
import { omitBy, take } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { type ExpensesListFieldsFragment, ExpenseStatus } from '@/lib/graphql/types/v2/graphql';
import { ExpenseType } from '@/lib/graphql/types/v2/schema';

import DateTime from '@/components/DateTime';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

type PlatformPaymentsViewProps = {
  expenses: ExpensesListFieldsFragment[];
  accountSlug: string;
};

const ROUTE_PARAMS = ['slug', 'section'];
const getQueryParams = newParams => {
  return omitBy({ ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
};

export function PlatformPaymentsView(props: PlatformPaymentsViewProps) {
  const [inViewCount, setInViewCount] = React.useState(5);
  const router = useRouter();
  const query = router.query;
  const expenseValidations = React.useMemo(
    () => ({ accountSlug: props.accountSlug, expenseType: ExpenseType.PLATFORM_BILLING }),
    [props.accountSlug],
  );

  const openExpenseId = query.ExpenseId ? Number(query.ExpenseId) : null;
  const setOpenExpenseId = React.useCallback(
    expenseId => {
      router.push(
        {
          pathname: `/dashboard/${props.accountSlug}/platform-subscription`,
          query: getQueryParams({ ...query, ExpenseId: expenseId }),
        },
        undefined,
        { shallow: true },
      );
    },
    [props.accountSlug, query, router],
  );

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
          {take(props.expenses, inViewCount).map((expense, idx) => (
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
                  <ExpenseStatusTag
                    status={
                      expense.status === ExpenseStatus.APPROVED
                        ? idx !== 0
                          ? 'OVERDUE'
                          : 'PAYMENT_DUE'
                        : expense.status
                    }
                  />
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
      <ExpenseDrawer
        openExpenseLegacyId={openExpenseId}
        handleClose={() => setOpenExpenseId(null)}
        validate={expenseValidations}
      />
    </div>
  );
}
