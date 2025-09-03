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
import { Alert, AlertTitle } from '../ui/Alert';
import { Button } from '../ui/Button';

type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

type Content = {
  [K in FeatureKey]?: {
    title: MessageDescriptor;
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
    benefits: [
      defineMessage({
        id: 'UpgradePlanCTA.CHART_OF_ACCOUNTS.accountingCategories',
        defaultMessage: 'Setup your accounting categories to mirror your accounting needs.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.CHART_OF_ACCOUNTS.categorize',
        defaultMessage: 'Assign expenses and added funds to their correct accounting categories.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.CHART_OF_ACCOUNTS.export',
        defaultMessage: 'Include the selected accounting categories in your exports.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.CHART_OF_ACCOUNTS.optimize',
        defaultMessage: 'Reduce the accounting costs, workload, and risk of accounting errors.',
      }),
    ],
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
  AGREEMENTS: {
    title: defineMessage({
      id: 'UpgradePlanCTA.AGREEMENTS.title',
      defaultMessage: 'Upgrade your plan to upload agreements',
    }),
    benefits: [
      defineMessage({
        id: 'UpgradePlanCTA.AGREEMENTS.compliance',
        defaultMessage: 'Track legal and contractual obligations for proper expense processing.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.AGREEMENTS.documentation',
        defaultMessage: 'Store all agreement documents in one centralized location.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.AGREEMENTS.expiration',
        defaultMessage: 'Set expiration dates to stay on top of agreement renewals.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.AGREEMENTS.review',
        defaultMessage: 'Access relevant agreements when reviewing expenses.',
      }),
    ],
    learnMoreUrl: 'https://documentation.opencollective.com/fiscal-hosts/managing-your-collectives/agreements',
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
  TRANSFERWISE: {
    title: defineMessage({
      id: 'UpgradePlanCTA.AUTOMATED_PAYMENTS.title',
      defaultMessage: 'Upgrade your plan for automated payments.',
    }),
    benefits: [
      defineMessage({
        id: 'UpgradePlanCTA.AUTOMATED_PAYMENTS.payOnPlatform',
        defaultMessage: 'Pay with a click of a button.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.AUTOMATED_PAYMENTS.ledger',
        defaultMessage: 'Transfer & fee values are automatically recorded.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.AUTOMATED_PAYMENTS.reduceErrors',
        defaultMessage: 'Reduce manual data entry errors.',
      }),
      defineMessage({
        id: 'UpgradePlanCTA.AUTOMATED_PAYMENTS.saveTime',
        defaultMessage: 'Process more expenses in less time.',
      }),
    ],
    learnMoreUrl:
      'https://documentation.opencollective.com/fiscal-hosts/expense-payment/paying-expenses-as-a-fiscal-host',
  },
};

type UpgradePlanCTAProps = {
  featureKey: FeatureKey;
  className?: string;
};

export function UpgradePlanCTA({ featureKey, className }: UpgradePlanCTAProps) {
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

  return (
    <React.Fragment>
      <Alert variant="default" className={cn('px-6 py-8', className)}>
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="rounded-full bg-muted p-4">
            <Image src="/static/images/lock.png" alt="Lock" width={64} height={64} className="" />
          </div>

          <AlertTitle className="mb-8 text-center text-2xl font-semibold text-balance text-foreground">
            {title}
          </AlertTitle>

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
                  <Link href={customContent.learnMoreUrl} target="_blank">
                    <FormattedMessage id="7DIW6+" defaultMessage="Learn More" />
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
