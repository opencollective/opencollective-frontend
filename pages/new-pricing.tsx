import React from 'react';
import { useQuery } from '@apollo/client';

import { getSSRQueryHelpers } from '@/lib/apollo-client';
import type {
  PlatformSubscriptionTiersQuery,
  PlatformSubscriptionTiersQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import NewPricing, { pricingPageQuery } from '../components/new-pricing';
import Page from '../components/Page';

const pricingPageQueryHelpers = getSSRQueryHelpers({
  query: pricingPageQuery,
  skipClientIfSSRThrows404: true,
});

// next.js export
// ts-unused-exports:disable-next-line
export const getServerSideProps = pricingPageQueryHelpers.getServerSideProps;

// next.js export
// ts-unused-exports:disable-next-line
export default function PricingPage() {
  const { data } = useQuery<PlatformSubscriptionTiersQuery, PlatformSubscriptionTiersQueryVariables>(pricingPageQuery);
  return (
    <Page>
      <NewPricing data={data} />
    </Page>
  );
}
