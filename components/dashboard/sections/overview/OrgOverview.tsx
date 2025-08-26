import React, { useCallback, useContext, useEffect, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { isHostAccount } from '@/lib/collective';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';

import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';

import { HostOverviewContent } from './HostOverviewContent';
import { OrgOverviewContent } from './OrgOverviewContent';
import { PlatformBillingOverviewCard } from './PlatformBillingOverviewCard';
import { SetupGuideCard } from './SetupGuide';

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
        LoggedInUser.collective.settings?.showSubscriptionCard?.[showSubscriptionCardKey];

      setShowSubscriptionCard(showSubscriptionCardSetting !== false ? true : false);
    }
  }, [LoggedInUser, account, showSetupGuide, showSubscriptionCard]);

  const isPlatformBillingFeatureEnabled =
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.PLATFORM_BILLING) && account?.platformSubscription;

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
          key: `showSubscriptionCard.id${account.legacyId}`,
          value: open,
        },
      }).catch(() => {});
      await refetchLoggedInUser();
    },
    [account, LoggedInUser, editAccountSetting, refetchLoggedInUser],
  );

  return (
    <div className="max-w-(--breakpoint-lg) space-y-6">
      <DashboardHeader
        title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
        actions={
          isHostAccount(account) && (
            <div className="flex gap-2">
              {isPlatformBillingFeatureEnabled && (
                <Button size="sm" variant="outline" onClick={() => handleSubscriptionCardToggle(!showSubscriptionCard)}>
                  {showSubscriptionCard ? (
                    <FormattedMessage defaultMessage="Hide subscription" id="SetupGuide.HideSubscriptionCard" />
                  ) : (
                    <FormattedMessage defaultMessage="Show subscription" id="SetupGuide.ShowSubscriptionCard" />
                  )}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => handleSetupGuideToggle(!showSetupGuide)}>
                {showSetupGuide ? (
                  <FormattedMessage defaultMessage="Hide setup guide" id="SetupGuide.HideSetupGuide" />
                ) : (
                  <FormattedMessage defaultMessage="Show setup guide" id="SetupGuide.ShowSetupGuide" />
                )}
              </Button>
            </div>
          )
        }
      />
      {isHostAccount(account) ? (
        <React.Fragment>
          {isPlatformBillingFeatureEnabled && (
            <Collapsible open={showSubscriptionCard}>
              <CollapsibleContent>
                <PlatformBillingOverviewCard accountSlug={account.slug} />
              </CollapsibleContent>
            </Collapsible>
          )}
          <SetupGuideCard account={account} open={showSetupGuide} setOpen={handleSetupGuideToggle} />
          <HostOverviewContent accountSlug={account.slug} />
        </React.Fragment>
      ) : (
        <OrgOverviewContent accountSlug={account.slug} />
      )}
    </div>
  );
}
