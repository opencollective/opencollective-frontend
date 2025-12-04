import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { integer } from '@/lib/filters/schemas';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type { KycRequestsDashboardQuery } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { EmptyResults } from '@/components/dashboard/EmptyResults';
import { Filterbar } from '@/components/dashboard/filters/Filterbar';
import { Pagination } from '@/components/dashboard/filters/Pagination';
import type { DashboardSectionProps } from '@/components/dashboard/types';
import { DocumentationCardList } from '@/components/documentation/DocumentationCardList';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import { kycVerificationCollectionFields } from '../graphql';

import { KYCVerificationRequestsTable } from './KYCVerificationRequestsTable';

const PAGE_SIZE = 20;

export function KYCRequests(props: DashboardSectionProps) {
  const queryFilter = useQueryFilter({
    schema: z.object({
      limit: integer.default(PAGE_SIZE),
      offset: integer.default(0),
    }),
    filters: {},
  });

  const {
    data,
    loading: queryLoading,
    error: queryError,
  } = useQuery<KycRequestsDashboardQuery>(
    gql`
      query KYCRequestsDashboard($slug: String!) {
        account(slug: $slug) {
          kycVerificationRequests {
            ...KYCVerificationCollectionFields
          }
        }
      }
      ${kycVerificationCollectionFields}
    `,
    {
      variables: {
        slug: props.accountSlug,
        ...queryFilter.variables,
      },
      context: API_V2_CONTEXT,
    },
  );

  const kycVerifications = data?.account?.kycVerificationRequests || { nodes: [], limit: 0, offset: 0, totalCount: 0 };
  const loading = queryLoading;
  const error = queryError;

  return (
    <div className="flex h-full max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="KYC Verification Requests" id="zlCqzf" />}
        description={
          <FormattedMessage
            defaultMessage="Manage KYC verification requests made by this organization to verify individuals"
            id="fOckb8"
          />
        }
      />
      <Filterbar {...queryFilter} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && kycVerifications.totalCount === 0 ? (
        <EmptyResults hasFilters={queryFilter.hasFilters} onResetFilters={() => queryFilter.resetFilters({})} />
      ) : (
        <div className="flex flex-col gap-4">
          <KYCVerificationRequestsTable
            data={kycVerifications.nodes}
            loading={loading}
            nbPlaceholders={queryFilter.values?.limit || 10}
          />
          <Pagination queryFilter={queryFilter} total={kycVerifications.totalCount} />
        </div>
      )}
      <DocumentationCardList
        className="mt-auto pt-6"
        docs={[
          {
            href: 'https://documentation.opencollective.com',
            title: 'KYC Verification',
            excerpt: 'Learn more about KYC verification and how to verify accounts on the platform.',
          },
        ]}
      />
    </div>
  );
}
