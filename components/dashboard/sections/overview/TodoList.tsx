import React from 'react';
import { Coins, Receipt } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { getDashboardRoute } from '../../../../lib/url-helpers';

import Link from '../../../Link';
import { DashboardContext } from '../../DashboardContext';

export const TodoList = () => {
  const { account } = React.useContext(DashboardContext);

  const pendingExpenseCount = account?.pendingExpenses.totalCount;
  const pausedIncomingContributionsCount = account?.pausedIncomingContributions.totalCount;
  const pausedOutgoingContributions = account?.pausedOutgoingContributions.totalCount;
  const canStartResumeContributionsProcess = account?.canStartResumeContributionsProcess;
  const canActOnPausedIncomingContributions =
    pausedIncomingContributionsCount > 0 && canStartResumeContributionsProcess;
  if (!pendingExpenseCount && !pausedOutgoingContributions && !canActOnPausedIncomingContributions) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">
        <FormattedMessage defaultMessage="To do" />
      </div>

      {pendingExpenseCount > 0 && (
        <div className="rounded-xl border bg-slate-50 p-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground ">
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
      )}

      {canActOnPausedIncomingContributions && (
        <div className="rounded-xl border bg-slate-50 p-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground ">
            <Coins size={16} />
            <span>
              <FormattedMessage
                defaultMessage="{pausedIncomingContributionsCount, plural, one {A recurring contribution to your Collective is paused} other {# recurring contributions to your Collective are paused}} and <Link>can be resumed</Link>."
                values={{
                  Link: chunks => (
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={getDashboardRoute(account, 'incoming-contributions?status=PAUSED')}
                    >
                      {chunks}
                    </Link>
                  ),
                  pausedIncomingContributionsCount: pausedIncomingContributionsCount,
                }}
              />
            </span>
          </div>
        </div>
      )}

      {pausedOutgoingContributions > 0 && (
        <div className="rounded-xl border bg-slate-50 p-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground ">
            <Coins size={16} />
            <span>
              <FormattedMessage
                defaultMessage="{pausedOutgoingContributions, plural, one {One of your recurring contributions is paused} other {# of your recurring contributions are paused}} and <Link>can be resumed</Link>."
                values={{
                  Link: chunks => (
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={getDashboardRoute(account, 'outgoing-contributions?status=PAUSED')}
                    >
                      {chunks}
                    </Link>
                  ),
                  pausedOutgoingContributions: pausedOutgoingContributions,
                }}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
