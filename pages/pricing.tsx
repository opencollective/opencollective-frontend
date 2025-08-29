import React from 'react';

import { getEnvVar } from '@/lib/env-utils';
import { parseToBoolean } from '@/lib/utils';

import NewPricing from '../components/new-pricing';
import Page from '../components/Page';
import Pricing from '../components/pricing';

// next.js export
// ts-unused-exports:disable-next-line
export default function PricingPage() {
  return <Page>{parseToBoolean(getEnvVar('NEW_PRICING')) ? <NewPricing /> : <Pricing />}</Page>;
}
