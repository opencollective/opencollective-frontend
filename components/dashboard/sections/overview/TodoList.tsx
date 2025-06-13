import React from 'react';
import { Coins, Receipt } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { getDashboardRoute } from '../../../../lib/url-helpers';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import Link from '../../../Link';
import { DashboardContext } from '../../DashboardContext';

export const AccountTodoList = () => {
  const { LoggedInUser } = useLoggedInUser();
  const { account } = React.useContext(DashboardContext);

  const hasGrantAndFundsReorgEnabled = LoggedInUser?.hasPreviewFeatureEnabled(
    PREVIEW_FEATURE_KEYS.GRANT_AND_FUNDS_REORG,
  );

  const pendingExpenseCount = hasGrantAndFundsReorgEnabled
    ? account?.pendingExpenses.totalCount
    : account?.pendingExpenses.totalCount + account?.pendingGrants.totalCount;
  const pendingGrantCount = hasGrantAndFundsReorgEnabled ? account?.pendingGrants.totalCount : 0;
  const pausedIncomingContributionsCount = account?.pausedIncomingContributions.totalCount;
  const pausedOutgoingContributions = account?.pausedOutgoingContributions.totalCount;
  const canStartResumeContributionsProcess = account?.canStartResumeContributionsProcess;
  const canActOnPausedIncomingContributions =
    pausedIncomingContributionsCount > 0 && canStartResumeContributionsProcess;

  if (
    !pendingExpenseCount &&
    !pendingGrantCount &&
    !pausedOutgoingContributions &&
    !canActOnPausedIncomingContributions
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">
        <FormattedMessage defaultMessage="To do" id="vwqEeH" />
      </div>
      <div className="divide-y rounded-xl border bg-slate-50">
        {pendingExpenseCount > 0 && (
          <div className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt size={16} />
              <span>
                <FormattedMessage
                  defaultMessage="{pendingExpenseCount, plural, one {<Link>{pendingExpenseCount} expense</Link> has} other {<Link>{pendingExpenseCount} expenses</Link> have}} not been reviewed"
                  id="PcyeDN"
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

        {pendingGrantCount > 0 && (
          <div className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt size={16} />
              <span>
                <FormattedMessage
                  defaultMessage="{pendingGrantCount, plural, one {<Link>{pendingGrantCount} grant</Link> has} other {<Link>{pendingGrantCount} grants</Link> have}} not been reviewed"
                  id="jLe6JL"
                  values={{
                    Link: chunks => (
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={getDashboardRoute(account, 'grants?status=PENDING')}
                      >
                        {chunks}
                      </Link>
                    ),
                    pendingGrantCount: pendingGrantCount,
                  }}
                />
              </span>
            </div>
          </div>
        )}

        {canActOnPausedIncomingContributions && (
          <div className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins size={16} />
              <span>
                <FormattedMessage
                  defaultMessage="{pausedIncomingContributionsCount, plural, one {A recurring contribution to your Collective is paused} other {# recurring contributions to your Collective are paused}} and <Link>can be resumed</Link>."
                  id="qck/cA"
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
          <div className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins size={16} />
              <span>
                <FormattedMessage
                  defaultMessage="{pausedOutgoingContributions, plural, one {One of your recurring contributions is paused} other {# of your recurring contributions are paused}} and <Link>can be resumed</Link>."
                  id="4HaZeO"
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
    </div>
  );
};
