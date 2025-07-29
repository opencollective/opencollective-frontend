import React, { useCallback, useContext, useEffect, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { isHostAccount } from '@/lib/collective';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';

import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';

import { HostOverviewContent } from './HostOverviewContent';
import { OrgOverviewContent } from './OrgOverviewContent';
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
  const [editAccountSetting] = useMutation(editAccountSettingMutation, {
    context: API_V2_CONTEXT,
  });

  useEffect(() => {
    if (LoggedInUser && showSetupGuide === undefined && account) {
      const showGuideKey = `id${account.legacyId}`;
      const showGuide = LoggedInUser.collective.settings?.showSetupGuide?.[showGuideKey];
      setShowSetupGuide(showGuide !== false ? true : false);
    }
  }, [LoggedInUser, account, showSetupGuide]);

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

  return (
    <div className="max-w-(--breakpoint-lg) space-y-6">
      <DashboardHeader
        title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
        actions={
          isHostAccount(account) && (
            <Button size="sm" variant="outline" onClick={() => handleSetupGuideToggle(!showSetupGuide)}>
              {showSetupGuide ? (
                <FormattedMessage defaultMessage="Hide setup guide" id="SetupGuide.HideSetupGuide" />
              ) : (
                <FormattedMessage defaultMessage="Show setup guide" id="SetupGuide.ShowSetupGuide" />
              )}
            </Button>
          )
        }
      />
      {isHostAccount(account) ? (
        <React.Fragment>
          <Collapsible open={showSetupGuide}>
            <CollapsibleContent>
              <SetupGuideCard account={account} setOpen={handleSetupGuideToggle} />
            </CollapsibleContent>
          </Collapsible>
          <HostOverviewContent accountSlug={account.slug} />
        </React.Fragment>
      ) : (
        <OrgOverviewContent accountSlug={account.slug} />
      )}
    </div>
  );
}
