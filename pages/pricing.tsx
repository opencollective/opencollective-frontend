import React from 'react';
import { useQuery } from '@apollo/client';

import { getSSRQueryHelpers } from '@/lib/apollo-client';
import { getEnvVar } from '@/lib/env-utils';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type {
  PlatformSubscriptionTiersQuery,
  PlatformSubscriptionTiersQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import { parseToBoolean } from '@/lib/utils';

import NewPricing, { pricingPageQuery } from '../components/new-pricing';
import Page from '../components/Page';
import Pricing from '../components/pricing';

const pricingPageQueryHelpers = getSSRQueryHelpers({
  query: pricingPageQuery,
  context: API_V2_CONTEXT,
  skipClientIfSSRThrows404: true,
});

// next.js export
// ts-unused-exports:disable-next-line
export const getServerSideProps = pricingPageQueryHelpers.getServerSideProps;

// next.js export
// ts-unused-exports:disable-next-line
export default function PricingPage() {
  const { data } = useQuery<PlatformSubscriptionTiersQuery, PlatformSubscriptionTiersQueryVariables>(pricingPageQuery, {
    context: API_V2_CONTEXT,
  });
  return <Page>{parseToBoolean(getEnvVar('NEW_PRICING')) ? <NewPricing data={data} /> : <Pricing />}</Page>;
}
