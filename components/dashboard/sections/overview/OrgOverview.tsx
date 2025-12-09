import React, { useCallback, useContext, useEffect, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { AlertTriangle, Settings } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { hasAccountMoneyManagement } from '@/lib/collective';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { getI18nLink } from '@/components/I18nFormatters';
import Link from '@/components/Link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';

import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';

import { ConvertedAccountMessage } from './ConvertedAccountMessage';
import { HostOverviewContent } from './HostOverviewContent';
import { OrgOverviewContent } from './OrgOverviewContent';
import { PlatformBillingOverviewCard } from './PlatformBillingOverviewCard';
import { WelcomeOrganization } from './Welcome';

const editAccountSettingMutation = gql`
  mutation UpdateSetupGuideState($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

export function OrgOverview() {
  const { account } = useContext(DashboardContext);
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [showSetupGuide, setShowSetupGuide] = useState(undefined);
  const [showSubscriptionCard, setShowSubscriptionCard] = useState(undefined);
  const [editAccountSetting] = useMutation(editAccountSettingMutation, {
    context: API_V2_CONTEXT,
  });

  useEffect(() => {
    if (!LoggedInUser || !account) {
      return;
    }

    if (showSubscriptionCard === undefined) {
      const showSubscriptionCardKey = `id${account.legacyId}`;
      const showSubscriptionCardSetting =
        LoggedInUser.collective.settings?.showInitialOverviewSubscriptionCard?.[showSubscriptionCardKey];

      setShowSubscriptionCard(showSubscriptionCardSetting !== false ? true : false);
    }
  }, [LoggedInUser, account, showSetupGuide, showSubscriptionCard]);

  const handleSetupGuideToggle = useCallback(
    async (open: boolean) => {
      setShowSetupGuide(open);

      await editAccountSetting({
        variables: {
          account: { legacyId: LoggedInUser.collective.id },
          key: `showSetupGuide.id${account.legacyId}`,
          value: open,
        },
      }).catch(() => {});
      await refetchLoggedInUser();
    },
    [account, LoggedInUser, editAccountSetting, refetchLoggedInUser],
  );

  const handleSubscriptionCardToggle = useCallback(
    async (open: boolean) => {
      setShowSubscriptionCard(open);

      await editAccountSetting({
        variables: {
          account: { legacyId: LoggedInUser.collective.id },
          key: `showInitialOverviewSubscriptionCard.id${account.legacyId}`,
          value: open,
        },
      }).catch(() => {});
      await refetchLoggedInUser();
    },
    [account, LoggedInUser, editAccountSetting, refetchLoggedInUser],
  );

  const hasMoneyManagement = hasAccountMoneyManagement(account);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleSetupGuideToggle(!showSetupGuide)}>
              {showSetupGuide ? (
                <FormattedMessage defaultMessage="Hide setup guide" id="SetupGuide.HideSetupGuide" />
              ) : (
                <FormattedMessage defaultMessage="Show setup guide" id="SetupGuide.ShowSetupGuide" />
              )}
            </Button>
          </div>
        }
      />
      <ConvertedAccountMessage account={account} />
      {!account.legalName && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            <FormattedMessage defaultMessage="Missing a legal name" id="WgAAJo" />
          </AlertTitle>
          <AlertDescription className="mt-2">
            <FormattedMessage
              defaultMessage="Organizations need to set a legal name to be compliant with regulations. <Link>Set your legal name</Link> to ensure compliance."
              id="PVdvtY"
              values={{
                Link: getI18nLink({
                  as: Link,
                  href: `/dashboard/${account.slug}/info?autofocus=legalName`,
                  icon: <Settings className="mr-1 inline-block h-4 w-4 align-middle" />,
                }),
              }}
            />
          </AlertDescription>
        </Alert>
      )}
      <WelcomeOrganization account={account} open={showSetupGuide} setOpen={handleSetupGuideToggle} />
      {hasMoneyManagement ? (
        <React.Fragment>
          {account.platformSubscription && (
            <Collapsible open={showSubscriptionCard}>
              <CollapsibleContent>
                <PlatformBillingOverviewCard
                  accountSlug={account.slug}
                  onDismiss={() => handleSubscriptionCardToggle(false)}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
          <HostOverviewContent accountSlug={account.slug} />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <OrgOverviewContent accountSlug={account.slug} />
        </React.Fragment>
      )}
    </div>
  );
}
