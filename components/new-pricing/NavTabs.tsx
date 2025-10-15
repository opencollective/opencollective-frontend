import React from 'react';
import { FormattedMessage } from 'react-intl';

import { TabsList, TabsTrigger } from '../crowdfunding-redesign/Tabs';

type PricingNavTabsProps = {
  active: 'organizations' | 'collectives';
  className?: string;
};

export default function PricingNavTabs({ active, className = '' }: PricingNavTabsProps) {
  return (
    <div className={`sticky top-0 z-10 border-b bg-background ${className}`}>
      <div className="relative mx-auto -mb-px h-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <TabsList centered={true}>
          <TabsTrigger href="/new-pricing" active={active === 'organizations'} className="text-base md:text-lg">
            <FormattedMessage defaultMessage="For Organizations" id="ipKxcj" />
          </TabsTrigger>
          <TabsTrigger
            href="/new-pricing/collectives"
            active={active === 'collectives'}
            className="text-base md:text-lg"
          >
            <FormattedMessage id="pricing.forCollective" defaultMessage="For Collectives" />
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  );
}
