import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { integer } from '@/lib/filters/schemas';
import type { KycTabPeopleDashboardQuery, KycVerificationCollection } from '@/lib/graphql/types/v2/graphql';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { accountHoverCardFields } from '@/components/AccountHoverCard';
import { Pagination } from '@/components/dashboard/filters/Pagination';
import { DocumentationCardList } from '@/components/documentation/DocumentationCardList';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { useModal } from '@/components/ModalContext';
import { Button } from '@/components/ui/Button';

import { kycVerificationCollectionFields } from '../graphql';
import { KYCRequestModal } from '../request/KYCRequestModal';

import { KYCVerificationRequestsTable } from './KYCVerificationRequestsTable';

type KYCTabPeopleDashboardProps = {
  requestedByAccount: AccountReferenceInput;
  verifyAccount: AccountReferenceInput;
};

const PAGE_SIZE = 5;

export function KYCTabPeopleDashboard(props: KYCTabPeopleDashboardProps) {
  const { showModal } = useModal();
  const queryFilter = useQueryFilter({
    skipRouter: true,
    schema: z.object({
      limit: integer.default(PAGE_SIZE),
      offset: integer.default(0),
    }),
    filters: {},
  });
  const query = useQuery<KycTabPeopleDashboardQuery>(
    gql`
      query KYCTabPeopleDashboard(
        $verifyAccountId: String!
        $requestedByAccount: AccountReferenceInput!
        $limit: Int!
        $offset: Int!
      ) {
        verifyAccount: account(id: $verifyAccountId) {
          id
          ... on Individual {
            kycVerifications(requestedByAccounts: [$requestedByAccount], limit: $limit, offset: $offset) {
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
      }
      ${kycVerificationCollectionFields}
      ${accountHoverCardFields}
    `,
    {
      variables: {
        verifyAccountId: props.verifyAccount.id,
        requestedByAccount: props.requestedByAccount,
        ...queryFilter.variables,
      },
    },
  );

  const kycVerifications =
    query.data?.verifyAccount && 'kycVerifications' in query.data.verifyAccount
      ? (query.data.verifyAccount.kycVerifications as KycVerificationCollection)
      : { nodes: [], limit: 0, offset: 0, totalCount: 0 };

  const onRequestKYCClick = React.useCallback(() => {
    showModal(KYCRequestModal, {
      requestedByAccount: props.requestedByAccount,
      verifyAccount: props.verifyAccount,
      refetchQueries: ['KYCTabPeopleDashboard', 'CommunityAccountDetail'],
    });
  }, [showModal, props.requestedByAccount, props.verifyAccount]);

  const hasVerifications = kycVerifications.totalCount > 0;
  const isEmpty = !query.loading && !query.error && !hasVerifications;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-end">
          <Button onClick={onRequestKYCClick} size="sm">
            <FormattedMessage defaultMessage="Submit KYC Verification" id="fS9N/M" />
          </Button>
        </div>
        {query.error ? (
          <MessageBoxGraphqlError error={query.error} />
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-2 text-slate-600">
              <FormattedMessage defaultMessage="This user has not been verified yet" id="06DMYQ" />
            </p>
          </div>
        ) : (
          <React.Fragment>
            <KYCVerificationRequestsTable
              data={kycVerifications.nodes}
              loading={query.loading}
              refetchQueries={['KYCTabPeopleDashboard', 'CommunityAccountDetail']}
              nbPlaceholders={PAGE_SIZE}
            />
            <Pagination queryFilter={queryFilter} total={kycVerifications.totalCount} />
          </React.Fragment>
        )}
      </div>
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
