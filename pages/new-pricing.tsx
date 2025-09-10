import React from 'react';

import { getSSRQueryHelpers } from '@/lib/apollo-client';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';

import NewPricing, { pricingPageQuery } from '../components/new-pricing';
import Page from '../components/Page';

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
  return (
    <Page>
      <NewPricing />
    </Page>
  );
}
