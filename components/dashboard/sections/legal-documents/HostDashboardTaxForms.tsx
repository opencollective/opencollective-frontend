import React from 'react';
import { useQuery } from '@apollo/client';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import type { HostTaxFormsQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { i18nLegalDocumentStatus } from '../../../../lib/i18n/legal-document';
import { sortSelectOptions } from '../../../../lib/utils';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { accountFilter } from '../../filters/AccountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { dateToVariables } from '../../filters/DateFilter/schema';
import { Filterbar } from '../../filters/Filterbar';
import { orderByFilter } from '../../filters/OrderFilter';
import { Pagination } from '../../filters/Pagination';
import { searchFilter } from '../../filters/SearchFilter';
import type { DashboardSectionProps } from '../../types';

import { useLegalDocumentActions } from './actions';
import LegalDocumentDrawer from './LegalDocumentDrawer';
import LegalDocumentsTable from './LegalDocumentsTable';

const hostDashboardTaxFormsQuery = gql`
  query HostTaxForms(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $account: [AccountReferenceInput]
    $status: [LegalDocumentRequestStatus]
    $orderBy: ChronologicalOrderInput
    $searchTerm: String
    $requestedAtFrom: DateTime
    $requestedAtTo: DateTime
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
      slug
      taxForms: hostedLegalDocuments(
        limit: $limit
        offset: $offset
        account: $account
        type: US_TAX_FORM
        status: $status
        orderBy: $orderBy
        searchTerm: $searchTerm
        requestedAtFrom: $requestedAtFrom
        requestedAtTo: $requestedAtTo
      ) {
        totalCount
        nodes {
          id
          year
          type
          status
          service
          requestedAt
          updatedAt
          documentLink
          isExpired
          account {
            id
            name
            slug
            type
            imageUrl(height: 128)
          }
        }
      }
    }
  }
`;

const NB_LEGAL_DOCUMENTS_DISPLAYED = 10;

const requestedAtDateFilter = {
  ...dateFilter,
  toVariables: value => dateToVariables(value, 'requestedAt'),
  filter: {
    ...dateFilter.filter,
    labelMsg: defineMessage({ id: 'LegalDocument.RequestedAt', defaultMessage: 'Requested at' }),
  },
};

const schema = z.object({
  limit: integer.default(NB_LEGAL_DOCUMENTS_DISPLAYED),
  offset: integer.default(0),
  account: accountFilter.schema,
  orderBy: orderByFilter.schema,
  searchTerm: searchFilter.schema,
  requestedAt: requestedAtDateFilter.schema,
  status: isMulti(z.nativeEnum(LegalDocumentRequestStatus)).optional(),
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostTaxFormsQueryVariables> = {
  account: accountFilter.toVariables,
  orderBy: orderByFilter.toVariables,
  searchTerm: searchFilter.toVariables,
  requestedAt: requestedAtDateFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  account: accountFilter.filter,
  orderBy: orderByFilter.filter,
  searchTerm: searchFilter.filter,
  requestedAt: requestedAtDateFilter.filter,
  status: {
    labelMsg: defineMessage({ id: 'LegalDocument.Status', defaultMessage: 'Status' }),
    valueRenderer: ({ intl, value }) => i18nLegalDocumentStatus(intl, value),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(LegalDocumentRequestStatus)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
  },
};

const HostDashboardTaxForms = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const [focusedLegalDocumentId, setFocusedLegalDocumentId] = React.useState(null);
  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    meta: { hostSlug },
  });
  const { data, error, loading, refetch } = useQuery(hostDashboardTaxFormsQuery, {
    variables: { hostSlug, ...queryFilter.variables },
    context: API_V2_CONTEXT,
  });
  const getActions = useLegalDocumentActions(data?.host, refetch);

  return (
    <div className="flex max-w-(--breakpoint-lg) flex-col gap-4">
      <DashboardHeader title={<FormattedMessage defaultMessage="Tax Forms" id="skSw4d" />} />

      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} my={4} />
      ) : !loading && !data?.host.taxForms?.nodes?.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="TAX_FORM"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <LegalDocumentsTable
            host={data?.host}
            documents={data?.host.taxForms}
            loading={loading}
            nbPlaceholders={NB_LEGAL_DOCUMENTS_DISPLAYED}
            resetFilters={() => queryFilter.resetFilters({})}
            getActions={getActions}
            onOpen={document => setFocusedLegalDocumentId(document.id)}
          />
          <Pagination queryFilter={queryFilter} total={data?.host?.taxForms?.totalCount} />
          {data?.host && (
            <LegalDocumentDrawer
              open={Boolean(focusedLegalDocumentId)}
              host={data.host}
              document={data.host.taxForms.nodes.find(d => d.id === focusedLegalDocumentId)}
              onClose={() => setFocusedLegalDocumentId(null)}
              getActions={getActions}
            />
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default HostDashboardTaxForms;
