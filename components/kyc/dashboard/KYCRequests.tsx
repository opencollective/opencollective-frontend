import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs } from '@/lib/filters/filter-types';
import { integer, isMulti } from '@/lib/filters/schemas';
import type { KycRequestsDashboardQuery } from '@/lib/graphql/types/v2/graphql';
import { KycVerificationStatus } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { accountHoverCardFields } from '@/components/AccountHoverCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { EmptyResults } from '@/components/dashboard/EmptyResults';
import ComboSelectFilter from '@/components/dashboard/filters/ComboSelectFilter';
import { Filterbar } from '@/components/dashboard/filters/Filterbar';
import { Pagination } from '@/components/dashboard/filters/Pagination';
import type { DashboardSectionProps } from '@/components/dashboard/types';
import { DocumentationCardList } from '@/components/documentation/DocumentationCardList';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import { kycVerificationCollectionFields } from '../graphql';
import { i18nKYCVerificationStatus } from '../intl';
import { SubmitKYCVerificationButton } from '../request/SubmitKYCVerificationButton';

import { KYCVerificationRequestsTable } from './KYCVerificationRequestsTable';

const PAGE_SIZE = 20;

const schema = z.object({
  limit: integer.default(PAGE_SIZE),
  offset: integer.default(0),
  status: isMulti(z.nativeEnum(KycVerificationStatus)).optional(),
});

type FilterValues = z.infer<typeof schema>;

const filters: FilterComponentConfigs<FilterValues> = {
  status: {
    labelMsg: defineMessage({ id: 'Status', defaultMessage: 'Status' }),
    Component: ({ intl, ...props }) => {
      const options = React.useMemo(
        () =>
          Object.values(KycVerificationStatus).map(value => ({
            label: i18nKYCVerificationStatus(intl, value),
            value,
          })),
        [intl],
      );
      return <ComboSelectFilter options={options} isMulti {...props} />;
    },
    valueRenderer: ({ value, intl }) => i18nKYCVerificationStatus(intl, value),
  },
};

export function KYCRequests(props: DashboardSectionProps) {
  const queryFilter = useQueryFilter({
    schema,
    filters,
  });

  const {
    data,
    loading: queryLoading,
    error: queryError,
  } = useQuery<KycRequestsDashboardQuery>(
    gql`
      query KYCRequestsDashboard($slug: String!, $limit: Int!, $offset: Int!, $status: [KYCVerificationStatus!]) {
        account(slug: $slug) {
          kycVerificationRequests(limit: $limit, offset: $offset, status: $status) {
            ...KYCVerificationCollectionFields
            nodes {
              ... on KYCVerification {
                account {
                  ...AccountHoverCardFields
                }
              }
            }
          }
        }
      }
      ${kycVerificationCollectionFields}
      ${accountHoverCardFields}
    `,
    {
      variables: {
        slug: props.accountSlug,
        ...queryFilter.variables,
      },
    },
  );

  const kycVerifications = data?.account?.kycVerificationRequests || {
    nodes: [],
    limit: 0,
    offset: 0,
    totalCount: 0,
  };
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
        actions={
          <SubmitKYCVerificationButton
            requestedByAccount={{ slug: props.accountSlug }}
            verifyAccount={null}
            refetchQueries={['KYCRequestsDashboard']}
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
            refetchQueries={['KYCRequestsDashboard']}
          />
          <Pagination queryFilter={queryFilter} total={kycVerifications.totalCount} />
        </div>
      )}
      <DocumentationCardList
        className="mt-auto pt-6"
        docs={[
          {
            href: 'https://documentation.opencollective.com/fiscal-hosts/know-your-customer-kyc',
            title: 'Know Your Customer (KYC)',
            excerpt:
              'KYC (Know Your Customer) verification is a critical process that helps organizations ensure compliance with regulatory requirements. It involves verifying the identity and legal information of account holders to prevent fraud and maintain security standards.',
          },
        ]}
      />
    </div>
  );
}
