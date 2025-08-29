import React from 'react';
import { Check } from 'lucide-react';
import type { MessageDescriptor } from 'react-intl';
import { defineMessage, FormattedMessage } from 'react-intl';

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

type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

type Content = {
  [K in FeatureKey]?: {
    title: MessageDescriptor;
    description?: MessageDescriptor;
    benefits?: MessageDescriptor[];
    learnMoreUrl?: string;
  };
};

const content: Content = {
  CHART_OF_ACCOUNTS: {
    title: defineMessage({
      id: 'UpgradePlanCTA.CHART_OF_ACCOUNTS.title',
      defaultMessage: 'Upgrade your plan to access chart of accounts.',
    }),
    learnMoreUrl: 'https://documentation.opencollective.com/fiscal-hosts/chart-of-accounts',
  },
  TAX_FORMS: {
    title: defineMessage({
      id: 'UpgradePlanCTA.TAX_FORMS.title',
      defaultMessage: 'Upgrade your plan to collect U.S. compliant tax forms',
    }),
    benefits: [
      defineMessage({
        id: 'UpgradePlanCTA.TAX_FORMS.compliance',
        defaultMessage: 'Stay compliant with US tax laws without manual tracking.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.TAX_FORMS.collect',
        defaultMessage: 'Automatically collect required tax forms from payees.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.TAX_FORMS.configureThreshold',
        defaultMessage: 'Configure payout thresholds to control when forms are needed.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.TAX_FORMS.prompt',
        defaultMessage: 'Prompt payees to submit forms before receiving payments.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.TAX_FORMS.preventPayouts',
        defaultMessage: 'Prevent payouts until all required forms are submitted.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.TAX_FORMS.sensitiveData',
        defaultMessage: 'Keep sensitive tax data secure and accessible only to admins.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.TAX_FORMS.export',
        defaultMessage: 'Export all tax forms at year-end for quick filing.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.TAX_FORMS.protect',
        defaultMessage: 'Protect your community by avoiding risky data storage.',
      }),
    ],
  },
  OFF_PLATFORM_TRANSACTIONS: {
    title: defineMessage({
      id: 'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.title',
      defaultMessage: 'Upgrade your plan to import off-platform transactions.',
    }),
    benefits: [
      defineMessage({
        id: 'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.offPlatformTransactions',
        defaultMessage:
          'Accurately represent your finances on the platform by importing off-platform financial activities',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.importing',
        defaultMessage: 'Automatically import transactions from banks and other financial services.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.reconcilliation',
        defaultMessage: 'Reconcile and match imported transactions with platform activities.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.accounting',
        defaultMessage: 'Provide your accountants with a consolidated transaction exports.',
      }),
    ],
  },
};

type UpgradeSubscriptionBlockerProps = {
  featureKey: FeatureKey;
  className?: string;
};

export function UpgradeSubscriptionBlocker({ featureKey, className }: UpgradeSubscriptionBlockerProps) {
  const { account } = React.useContext(DashboardContext);

  if (isFeatureEnabled(account, featureKey)) {
    return null;
  }
  const featureAccess = account.features[featureKey];
  const customContent = content[featureKey];
  const title =
    featureAccess === CollectiveFeatureStatus.DISABLED ? (
      customContent?.title ? (
        <FormattedMessage {...customContent.title} />
      ) : (
        <FormattedMessage id="UpgradePlanCTA.title.DISABLED" defaultMessage="Upgrade Required" />
      )
    ) : featureAccess === CollectiveFeatureStatus.UNSUPPORTED ? (
      <FormattedMessage id="UpgradePlanCTA.title.UNSUPPORTED" defaultMessage="Feature not supported for your account" />
    ) : null;

  const description =
    featureAccess === CollectiveFeatureStatus.DISABLED ? (
      customContent?.description ? (
        <FormattedMessage {...customContent.description} />
      ) : (
        <FormattedMessage
          id="UpgradePlanCTA.description.DISABLED"
          defaultMessage="This feature is not available on your current plan. Upgrade your subscription to access this feature."
        />
      )
    ) : featureAccess === CollectiveFeatureStatus.UNSUPPORTED ? (
      <FormattedMessage
        id="UpgradePlanCTA.description.UNSUPPORTED"
        defaultMessage="Your account type does not support this feature."
      />
    ) : null;

  return (
    <React.Fragment>
      <Alert variant="default" className={cn('px-6 py-8', className)}>
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
          {description && <AlertDescription className="max-w-md text-muted-foreground">{description}</AlertDescription>}

          {/* Benefits List */}
          {featureAccess === 'DISABLED' && customContent?.benefits && (
            <div className="w-full max-w-xl space-y-3">
              {customContent.benefits.map(benefit => (
                <div key={benefit.id} className="flex items-start gap-3 text-left">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span className="text-slate-700">
                    <FormattedMessage {...benefit} />
                  </span>
                </div>
              ))}
            </div>
          )}

          {featureAccess === 'DISABLED' && (
            <div className="flex gap-3 pt-2">
              <Button asChild size="sm">
                <Link href={getDashboardRoute(account, 'platform-subscription')}>
                  <FormattedMessage id="UpgradePlanCTA.upgradeButton" defaultMessage="Upgrade your plan" />
                </Link>
              </Button>
              {customContent?.learnMoreUrl && (
                <Button asChild variant="outline" size="sm">
                  <Link href={customContent.learnMoreUrl}>
                    <FormattedMessage id="UpgradePlanCTA.learnMoreButton" defaultMessage="Learn More" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </Alert>
    </React.Fragment>
  );
}
