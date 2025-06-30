import React from 'react';
import { FormattedMessage } from 'react-intl';

import { isHostAccount } from '@/lib/collective';

// import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
// import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';
// import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';

import { HostOverviewContent } from './HostOverviewContent';
import { OrgOverviewContent } from './OrgOverviewContent';

export function OrgOverview() {
  const { account } = React.useContext(DashboardContext);
  // const [showSetupGuide, setShowSetupGuide] = React.useState(false);

  return (
    <div className="max-w-(--breakpoint-lg) space-y-6">
      <DashboardHeader
        title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
        // actions={
        //   <Button
        //     size="sm"
        //     variant="outline"
        //     onClick={() => {
        //       setShowSetupGuide(open => !open);
        //     }}
        //   >
        //     {showSetupGuide ? (
        //       <FormattedMessage defaultMessage="Hide setup guide" id="SetupGuide.HideSetupGuide" />
        //     ) : (
        //       <FormattedMessage defaultMessage="Show setup guide" id="SetupGuide.ShowSetupGuide" />
        //     )}
        //   </Button>
        // }
      />
      {/* <Collapsible open={showSetupGuide}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                <FormattedMessage defaultMessage="Setup guide" id="SetupGuide.Title" />
              </CardTitle>
              <CardDescription>Get going with Open Collective!</CardDescription>
            </CardHeader>
            <CardContent>TBD</CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible> */}

      {isHostAccount(account) ? (
        <HostOverviewContent accountSlug={account.slug} />
      ) : (
        <OrgOverviewContent accountSlug={account.slug} />
      )}
    </div>
  );
}
