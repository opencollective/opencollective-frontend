import React from 'react';
import { Receipt } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { CollectiveOverviewQuery } from '../../../../lib/graphql/types/v2/graphql';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import Link from '../../../Link';
import clsx from 'clsx';

export const TodoList = ({ account, alt }: { account: CollectiveOverviewQuery['account']; alt?: boolean }) => {
  const pendingExpenseCount = account?.pendingExpenses.totalCount;
  if (!pendingExpenseCount) {
    return null;
  }
  return (
    <div className="">
      <div className={clsx('flex flex-col gap-1 rounded-xl border  p-3 text-sm', !alt && 'bg-slate-50')}>
        {alt ? <div className="text-sm font-medium tracking-tight">To do</div> : null}
        <div className="flex items-center gap-2 text-muted-foreground">
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
