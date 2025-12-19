import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Settings } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { hasAccountMoneyManagement } from '@/lib/collective';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';

import { ConvertedAccountMessage } from './ConvertedAccountMessage';
import { HostOverviewContent } from './HostOverviewContent';
import { OrgOverviewContent } from './OrgOverviewContent';
import { PlatformBillingOverviewCard } from './PlatformBillingOverviewCard';
import { editAccountSettingMutation } from './queries';
import { WelcomeOrganization } from './Welcome';

export function OrgOverview() {
  const { account } = useContext(DashboardContext);
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [showSetupGuide, setShowSetupGuide] = useState(undefined);
  const [showSubscriptionCard, setShowSubscriptionCard] = useState(undefined);
  const [editAccountSetting] = useMutation(editAccountSettingMutation);

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="outline">
                <Settings size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={showSetupGuide}
                onClick={() => handleSetupGuideToggle(!showSetupGuide)}
              >
                <FormattedMessage defaultMessage="Display setup guide" id="SetupGuide.DisplaySetupGuide" />
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <ConvertedAccountMessage account={account} />
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
