import React from 'react';
import { useQuery } from '@apollo/client';

import { getSSRQueryHelpers } from '@/lib/apollo-client';
import { getEnvVar } from '@/lib/env-utils';
import type {
  PlatformSubscriptionTiersQuery,
  PlatformSubscriptionTiersQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import { parseToBoolean } from '@/lib/utils';

import NewPricing, { pricingPageQuery } from '../components/new-pricing';
import Page from '../components/Page';
import Pricing from '../components/pricing';

const isNewPricing = parseToBoolean(getEnvVar('NEW_PRICING'));

const pricingPageQueryHelpers = getSSRQueryHelpers({
  query: pricingPageQuery,
  skipClientIfSSRThrows404: true,
});

// next.js export
// ts-unused-exports:disable-next-line
export const getServerSideProps = isNewPricing ? pricingPageQueryHelpers.getServerSideProps : undefined;

// next.js export
// ts-unused-exports:disable-next-line
export default function PricingPage() {
  const { data } = useQuery<PlatformSubscriptionTiersQuery, PlatformSubscriptionTiersQueryVariables>(pricingPageQuery, {
    skip: !isNewPricing,
  });

  return (
    <Page>
      {isNewPricing ? <NewPricing data={data} /> : <Pricing />}
    </Page>
  );
}
