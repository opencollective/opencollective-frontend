import React from 'react';
import { FormattedMessage } from 'react-intl';

import { isHostAccount } from '@/lib/collective';

import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';

import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';

import { HostOverviewContent } from './HostOverviewContent';
import { OrgOverviewContent } from './OrgOverviewContent';
import { SetupGuideCard } from './SetupGuide';

export function OrgOverview() {
  const { account } = React.useContext(DashboardContext);
  const [showSetupGuide, setShowSetupGuide] = React.useState(true);

  return (
    <div className="max-w-(--breakpoint-lg) space-y-6">
      <DashboardHeader
        title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowSetupGuide(open => !open);
            }}
          >
            {showSetupGuide ? (
              <FormattedMessage defaultMessage="Hide setup guide" id="SetupGuide.HideSetupGuide" />
            ) : (
              <FormattedMessage defaultMessage="Show setup guide" id="SetupGuide.ShowSetupGuide" />
            )}
          </Button>
        }
      />
      <Collapsible open={showSetupGuide}>
        <CollapsibleContent>
          <SetupGuideCard account={account} />
        </CollapsibleContent>
      </Collapsible>

      {isHostAccount(account) ? (
        <HostOverviewContent accountSlug={account.slug} />
      ) : (
        <OrgOverviewContent accountSlug={account.slug} />
      )}
    </div>
  );
}
