import React from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { CollectiveFeatures } from '../../lib/graphql/types/v2/schema';
import { isFeatureEnabled } from '@/lib/allowed-features';
import { CollectiveFeatureStatus } from '@/lib/graphql/types/v2/graphql';
import { getDashboardRoute } from '@/lib/url-helpers';
import { cn } from '@/lib/utils';

import Image from '@/components/Image';

import { DashboardContext } from '../dashboard/DashboardContext';
import Link from '../Link';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Button } from '../ui/Button';

type FeatureKey = Exclude<keyof CollectiveFeatures, 'id' | '__typename'>;

type UpgradeSubscriptionBlockerProps = {
  featureKey: FeatureKey;
  className?: string;
  description?: string;
};

export function UpgradeSubscriptionBlocker(props: UpgradeSubscriptionBlockerProps) {
  const { account } = React.useContext(DashboardContext);

  if (isFeatureEnabled(account, props.featureKey)) {
    return null;
  }
  const featureAccess = account.features[props.featureKey];
  const title =
    featureAccess === CollectiveFeatureStatus.DISABLED ? (
      <FormattedMessage id="UpgradeSubscriptionBlocker.title.DISABLED" defaultMessage="Upgrade Required" />
    ) : featureAccess === CollectiveFeatureStatus.UNSUPPORTED ? (
      <FormattedMessage
        id="UpgradeSubscriptionBlocker.title.UNSUPPORTED"
        defaultMessage="Feature not supported for your account"
      />
    ) : null;

  const description =
    featureAccess === CollectiveFeatureStatus.DISABLED ? (
      (props.description ?? (
        <FormattedMessage
          id="UpgradeSubscriptionBlocker.description.DISABLED"
          defaultMessage="This feature is not available on your current plan. Upgrade your subscription to access this feature."
        />
      ))
    ) : featureAccess === CollectiveFeatureStatus.UNSUPPORTED ? (
      <FormattedMessage
        id="UpgradeSubscriptionBlocker.description.UNSUPPORTED"
        defaultMessage="Your account type does not support this feature."
      />
    ) : null;

  return (
    <React.Fragment>
      <Alert variant="info" className={cn('flex gap-2 py-5', props.className)}>
        <div className="p-1">
          <Image src="/static/images/lock.png" alt="Lock" width={48} height={48} className="" />
        </div>
        <div>
          <AlertTitle className="flex items-center gap-2">{title}</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="flex flex-col gap-3">
              <p>{description}</p>
              {featureAccess === 'DISABLED' && (
                <Button asChild className="w-fit" size="sm">
                  <Link href={getDashboardRoute(account, 'platform-subscription')}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    <FormattedMessage id="UpgradeSubscriptionBlocker.upgradeButton" defaultMessage="Upgrade Plan" />
                  </Link>
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </Alert>
    </React.Fragment>
  );
}
