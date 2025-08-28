import React from 'react';
import { Check } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { FEATURES } from '@/lib/allowed-features';
import { isFeatureEnabled } from '@/lib/allowed-features';
import { CollectiveFeatureStatus } from '@/lib/graphql/types/v2/graphql';
import { getDashboardRoute } from '@/lib/url-helpers';
import { cn } from '@/lib/utils';

import Image from '@/components/Image';

import { DashboardContext } from '../dashboard/DashboardContext';
import Link from '../Link';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Button } from '../ui/Button';

type UpgradeSubscriptionBlockerProps = {
  featureKey: (typeof FEATURES)[keyof typeof FEATURES];
  className?: string;
  title?: string;
  description?: string;
};

const content = {
  OFF_PLATFORM_TRANSACTIONS: {
    title: (
      <FormattedMessage
        id="UpgradeSubscriptionBlocker.OFF_PLATFORM_TRANSACTIONS.title"
        defaultMessage="Upgrade your plan to import off-platform transactions."
      />
    ),
    description: (
      <div className="space-y-1 text-center">
        <div>
          <FormattedMessage
            id="UpgradeSubscriptionBlocker.OFF_PLATFORM_TRANSACTIONS.description.line1"
            defaultMessage="This feature is not available on your current tier (Discover)."
          />
        </div>
        <div>
          <FormattedMessage
            id="UpgradeSubscriptionBlocker.OFF_PLATFORM_TRANSACTIONS.description.line2"
            defaultMessage="To gain access, upgrade to the Pro Tier."
          />
        </div>
      </div>
    ),
    features: [
      <FormattedMessage
        id="UpgradeSubscriptionBlocker.OFF_PLATFORM_TRANSACTIONS.feature.offPlatformTransactions"
        defaultMessage="Accurately represent your finances on the platform by importing off-platform financial activities"
      />,
      <FormattedMessage
        id="UpgradeSubscriptionBlocker.OFF_PLATFORM_TRANSACTIONS.feature.importing"
        defaultMessage="Automatically import transactions from banks and other financial services."
      />,
      <FormattedMessage
        id="UpgradeSubscriptionBlocker.OFF_PLATFORM_TRANSACTIONS.feature.reconcilliation"
        defaultMessage="Reconcile and match imported transactions with platform activities."
      />,
      <FormattedMessage
        id="UpgradeSubscriptionBlocker.OFF_PLATFORM_TRANSACTIONS.feature.accounting"
        defaultMessage="Provide your accountants with a consolidated transaction exports."
      />,
    ],
  },
};

export function UpgradeSubscriptionBlocker(props: UpgradeSubscriptionBlockerProps) {
  const { account } = React.useContext(DashboardContext);

  if (isFeatureEnabled(account, props.featureKey)) {
    return null;
  }
  const featureAccess = account.features[props.featureKey];
  const customContent = content[props.featureKey];
  const title =
    featureAccess === CollectiveFeatureStatus.DISABLED ? (
      (customContent?.title ?? (
        <FormattedMessage id="UpgradeSubscriptionBlocker.title.DISABLED" defaultMessage="Upgrade Required" />
      ))
    ) : featureAccess === CollectiveFeatureStatus.UNSUPPORTED ? (
      <FormattedMessage
        id="UpgradeSubscriptionBlocker.title.UNSUPPORTED"
        defaultMessage="Feature not supported for your account"
      />
    ) : null;

  const description =
    featureAccess === CollectiveFeatureStatus.DISABLED ? (
      (customContent?.description ?? (
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
      <Alert variant="default" className={cn('px-6 py-8', props.className)}>
        <div className="flex flex-col items-center space-y-6 text-center">
          {/* Lock Icon */}
          <div className="rounded-full bg-muted p-4">
            <Image src="/static/images/lock.png" alt="Lock" width={64} height={64} className="" />
          </div>

          {/* Title */}
          <AlertTitle className="mb-8 text-center text-2xl font-semibold text-balance text-foreground">
            {title}
          </AlertTitle>

          {/* Description */}
          {/* <AlertDescription className="max-w-md text-muted-foreground">{description}</AlertDescription> */}

          {/* Features List */}
          {featureAccess === 'DISABLED' && customContent?.features && (
            <div className="w-full max-w-xl space-y-3">
              {customContent.features.map((feature, index) => {
                // Extract the id from the FormattedMessage props for a unique key
                const featureId =
                  React.isValidElement(feature) &&
                  typeof feature.props === 'object' &&
                  feature.props !== null &&
                  'id' in feature.props &&
                  typeof feature.props.id === 'string'
                    ? feature.props.id
                    : `feature-${props.featureKey}-${index}`;
                return (
                  <div key={featureId} className="flex items-start gap-3 text-left">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          {featureAccess === 'DISABLED' && (
            <div className="flex gap-3 pt-2">
              <Button asChild size="sm">
                <Link href={getDashboardRoute(account, 'platform-subscription')}>
                  <FormattedMessage id="UpgradeSubscriptionBlocker.upgradeButton" defaultMessage="Upgrade your plan" />
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <FormattedMessage id="UpgradeSubscriptionBlocker.learnMoreButton" defaultMessage="Learn More" />
              </Button>
            </div>
          )}
        </div>
      </Alert>
    </React.Fragment>
  );
}
