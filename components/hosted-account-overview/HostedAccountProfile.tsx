import React from 'react';
import { useQuery } from '@apollo/client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import type { HostedAccountProfileQuery, HostedAccountProfileQueryVariables } from '@/lib/graphql/types/v2/graphql';
import formatCollectiveType from '@/lib/i18n/collective-type';

import Avatar from '@/components/Avatar';
import { CopyID } from '@/components/CopyId';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { MoreActionsMenu } from '@/components/dashboard/sections/collectives/common';
import { getCollectiveTypeIcon } from '@/components/dashboard/sections/community/common';
import { makeReplaceSubpath } from '@/components/dashboard/utils';
import Link from '@/components/Link';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import Tabs from '@/components/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

import { HostedAccountAboutTab } from './HostedAccountAboutTab';
import { HostedAccountAccountsTab } from './HostedAccountAccountsTab';
import { HostedAccountActivitiesTab } from './HostedAccountActivitiesTab';
import { HostedAccountAgreementsTab } from './HostedAccountAgreementsTab';
import { HostedAccountExpectedFundsTab } from './HostedAccountExpectedFundsTab';
import { HostedAccountMoneyMovementsTab, type MoneyMovementsView } from './HostedAccountMoneyMovementsTab';
import { HostedAccountOverviewTab } from './HostedAccountOverviewTab';
import { HostedAccountUpdatesTab } from './HostedAccountUpdatesTab';
import { hostedAccountProfileQuery } from './queries';
import type { HostedAccountProfileData } from './types';
import { HostedAccountView } from './types';

type HostedAccountProfileProps = {
  hostSlug: string;
  accountId: string;
};

export function HostedAccountProfile({ hostSlug, accountId }: HostedAccountProfileProps) {
  const intl = useIntl();
  const router = useRouter();
  const selectedTab = (router.query?.subpath?.[1] as HostedAccountView) || HostedAccountView.OVERVIEW;

  const [moneyMovementsView, setMoneyMovementsView] = React.useState<MoneyMovementsView | undefined>(undefined);

  const setSelectedTab = React.useCallback(
    (tab: HostedAccountView) => {
      if (selectedTab !== tab) {
        makeReplaceSubpath(router)(`${accountId}/${tab}`);
      }
    },
    [router, accountId, selectedTab],
  );

  const openTab = React.useCallback(
    (tab: HostedAccountView, view?: MoneyMovementsView) => {
      setMoneyMovementsView(view);
      setSelectedTab(tab);
    },
    [setSelectedTab],
  );

  const query = useQuery<HostedAccountProfileQuery, HostedAccountProfileQueryVariables>(hostedAccountProfileQuery, {
    variables: { hostSlug, accountId },
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const isLoading = query.loading && !query.data;
  const account = query.data?.account as HostedAccountProfileData | undefined;
  const host = query.data?.host;
  const refetch = () => query.refetch();

  const parentPublicId = account?.parent?.publicId;
  React.useEffect(() => {
    if (parentPublicId) {
      makeReplaceSubpath(router)(`${parentPublicId}/${selectedTab}`);
    }
  }, [parentPublicId, selectedTab, router]);

  const tabs = React.useMemo(
    () => [
      {
        id: HostedAccountView.OVERVIEW,
        label: <FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />,
      },
      {
        id: HostedAccountView.ACCOUNTS,
        label: <FormattedMessage defaultMessage="Accounts" id="FvanT6" />,
        // +1 for the synthetic "main account" row shown alongside children.
        count: account ? (account.childrenAccounts?.nodes?.length || 0) + 1 : undefined,
      },
      {
        id: HostedAccountView.MONEY_MOVEMENTS,
        label: <FormattedMessage defaultMessage="Money Movements" id="MoneyMovements" />,
      },
      {
        id: HostedAccountView.EXPECTED_FUNDS,
        label: <FormattedMessage defaultMessage="Expected Funds" id="ExpectedFunds" />,
      },
      {
        id: HostedAccountView.AGREEMENTS,
        label: <FormattedMessage defaultMessage="Agreements" id="Agreements" />,
        count: host?.hostedAccountAgreements?.totalCount,
      },
      {
        id: HostedAccountView.UPDATES,
        label: <FormattedMessage defaultMessage="Updates" id="updates" />,
        count: account?.updates?.totalCount,
      },
      {
        id: HostedAccountView.ABOUT,
        label: <FormattedMessage defaultMessage="About" id="collective.about.title" />,
      },
      { id: HostedAccountView.ACTIVITIES, label: <FormattedMessage defaultMessage="Activities" id="Activities" /> },
    ],
    [account, host?.hostedAccountAgreements?.totalCount],
  );

  // Redirecting a child to its parent
  if (parentPublicId) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <button className="mb-4 flex w-fit items-center text-xs text-gray-500" onClick={() => history.back()}>
        <ArrowLeft size="14px" className="mr-1" />
        <FormattedMessage defaultMessage="Go Back" id="GoBack" />
      </button>
      <DashboardHeader
        title={
          <div className="flex items-center gap-3">
            {isLoading ? (
              <React.Fragment>
                <Skeleton className="aspect-square size-9" />
                <Skeleton className="h-6 w-48" />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Avatar collective={account} size={60} />
                <div className="flex flex-col">
                  <div>{account?.name || account?.slug}</div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge size="sm" type="outline" className="gap-1 rounded-full">
                      {getCollectiveTypeIcon(account?.type, { size: 12 })}
                      {formatCollectiveType(intl, account?.type)}
                    </Badge>
                    {account?.isFrozen && (
                      <Badge size="sm" type="info">
                        <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
                      </Badge>
                    )}
                    {account?.isPrivate && (
                      <Badge size="sm" type="outline">
                        <FormattedMessage defaultMessage="Private" id="Private" />
                      </Badge>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
        }
        actions={
          <React.Fragment>
            {account && !account.isPrivate && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${account.slug}`}>
                  <FormattedMessage defaultMessage="View Profile" id="viewProfile" />
                </Link>
              </Button>
            )}
            <CopyID
              value={typeof window !== 'undefined' ? window.location.href : ''}
              className="relative inline-flex h-9 items-center justify-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
              Icon={null}
              toastOnCopy
            >
              <FormattedMessage defaultMessage="Copy URL" id="P8QaSQ" />
            </CopyID>
            {account && host?.id === account.host?.id && (
              <MoreActionsMenu collective={account} onEdit={refetch}>
                <Button size="sm" variant="outline">
                  <FormattedMessage defaultMessage="More Actions" id="A7ugfn" />
                </Button>
              </MoreActionsMenu>
            )}
          </React.Fragment>
        }
      />
      <div className="mt-4 flex flex-grow flex-col gap-4">
        {query.error ? (
          <MessageBoxGraphqlError error={query.error} />
        ) : (
          <React.Fragment>
            <Tabs tabs={tabs} selectedId={selectedTab} onChange={tab => openTab(tab as HostedAccountView)} />
            {selectedTab === HostedAccountView.OVERVIEW && (
              <HostedAccountOverviewTab account={account} host={host} openTab={openTab} />
            )}
            {selectedTab === HostedAccountView.ACCOUNTS && (
              <HostedAccountAccountsTab account={account} host={host} loading={isLoading} onEdit={refetch} />
            )}
            {selectedTab === HostedAccountView.MONEY_MOVEMENTS && (
              <HostedAccountMoneyMovementsTab account={account} hostSlug={hostSlug} initialView={moneyMovementsView} />
            )}
            {selectedTab === HostedAccountView.EXPECTED_FUNDS && (
              <HostedAccountExpectedFundsTab account={account} hostSlug={hostSlug} />
            )}
            {selectedTab === HostedAccountView.AGREEMENTS && (
              <HostedAccountAgreementsTab account={account} hostSlug={hostSlug} />
            )}
            {selectedTab === HostedAccountView.UPDATES && <HostedAccountUpdatesTab account={account} />}
            {selectedTab === HostedAccountView.ABOUT && <HostedAccountAboutTab account={account} />}
            {selectedTab === HostedAccountView.ACTIVITIES && <HostedAccountActivitiesTab account={account} />}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
