import React from 'react';
import { Receipt } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { CollectiveOverviewQuery } from '../../../../lib/graphql/types/v2/graphql';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import Link from '../../../Link';

export const TodoList = ({ account }: { account: CollectiveOverviewQuery['account'] }) => {
  const pendingExpenseCount = account?.pendingExpenses.totalCount;
  if (!pendingExpenseCount) {
    return null;
  }
  return (
    <div className="">
      <div className="rounded-xl border bg-slate-50 p-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground antialiased">
          <Receipt size={16} />
          <span>
            <FormattedMessage
              defaultMessage="{pendingExpenseCount, plural, one {<Link>{pendingExpenseCount} expense</Link> has} other {<Link>{pendingExpenseCount} expenses</Link> have}} not been reviewed"
              values={{
                Link: chunks => (
                  <Link
                    className="font-medium text-primary hover:underline"
                    href={getDashboardRoute(account, 'expenses?status=PENDING')}
                  >
                    {chunks}
                  </Link>
                ),
                pendingExpenseCount: pendingExpenseCount,
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
};
