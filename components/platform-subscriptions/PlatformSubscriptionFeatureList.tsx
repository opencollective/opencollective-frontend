import React from 'react';
import { clsx } from 'clsx';
import { Check, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { PlatformSubscriptionFeatures, PlatformSubscriptionFeatureTitles } from './constants';

type PlatformSubscriptionFeatureListProps = {
  features: Record<(typeof PlatformSubscriptionFeatures)[number], boolean>;
};
export function PlatformSubscriptionFeatureList(props: PlatformSubscriptionFeatureListProps) {
  return (
    <ul className="space-y-3">
      {PlatformSubscriptionFeatures.map(feature => {
        const isEnabled = props.features?.[feature];
        return (
          <li key={feature} className="flex items-center gap-3 text-sm">
            {isEnabled ? <Check className="size-4 text-green-600" /> : <X className="size-4 text-destructive" />}
            <span
              className={clsx('text-nowrap', {
                'text-muted-foreground': !isEnabled,
              })}
            >
              <FormattedMessage {...PlatformSubscriptionFeatureTitles[feature]} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
