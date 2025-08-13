import React from 'react';
import clsx from 'clsx';
import { Check, Minus } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { PlatformSubscriptionFeatures, PlatformSubscriptionFeatureTitles } from './constants';

type PlatformSubscriptionFeatureListProps = {
  features: Record<(typeof PlatformSubscriptionFeatures)[number], boolean>;
};
export function PlatformSubscriptionFeatureList(props: PlatformSubscriptionFeatureListProps) {
  return (
    <div className="flex flex-col gap-2">
      {PlatformSubscriptionFeatures.map(feature => {
        const isEnabled = props.features?.[feature];
        return (
          <div key={feature} className="flex gap-4">
            <div>{isEnabled ? <Check className="text-green-400" /> : <Minus className="text-muted-foreground" />}</div>
            <div
              className={clsx('text-nowrap', {
                'font-semibold': isEnabled,
                'text-muted-foreground': !isEnabled,
              })}
            >
              <FormattedMessage {...PlatformSubscriptionFeatureTitles[feature]} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
