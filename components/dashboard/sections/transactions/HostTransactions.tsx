import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { TransactionsTableQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { getOffPlatformTransactionsRoute } from '@/lib/url-helpers';

import Image from '@/components/Image';
import Link from '@/components/Link';
import { Card, CardContent } from '@/components/ui/Card';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ExportTransactionsCSVModal from '../../ExportTransactionsCSVModal';
import { accountingCategoryFilter } from '../../filters/AccountingCategoryFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import type { DashboardSectionProps } from '../../types';

import type { FilterMeta as CommonFilterMeta } from './filters';
import { filters as commonFilters, schema as commonSchema, toVariables as commonToVariables } from './filters';
import { transactionsTableQuery } from './queries';
import TransactionsTable from './TransactionsTable';

export const schema = commonSchema.extend({
  account: hostedAccountFilter.schema,
  excludeAccount: z.string().optional(),
  accountingCategory: accountingCategoryFilter.schema,
});

export type FilterValues = z.infer<typeof schema>;

type FilterMeta = CommonFilterMeta & {
  hostSlug: string;
};

// Only needed when values and key of filters are different
// to expected key and value of QueryVariables
export const toVariables: FiltersToVariables<FilterValues, TransactionsTableQueryVariables, FilterMeta> = {
  ...commonToVariables,
  account: hostedAccountFilter.toVariables,
  excludeAccount: value => ({ excludeAccount: { slug: value } }),
};

// The filters config is used to populate the Filters component.
const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...commonFilters,
  account: hostedAccountFilter.filter,
  excludeAccount: {
    ...hostedAccountFilter.filter,
    labelMsg: defineMessage({ defaultMessage: 'Exclude account', id: 'NBPN5y' }),
  },
  accountingCategory: accountingCategoryFilter.filter,
};

const hostTransactionsMetaDataQuery = gql`
  query HostTransactionsMetaData($slug: String!) {
    transactions(host: { slug: $slug }, limit: 0) {
      paymentMethodTypes
      kinds
    }
    host(slug: $slug) {
      id
      name
      legacyId
      slug
      currency
      settings
      accountingCategories {
        nodes {
          id
          code
          name
          kind
          appliesTo
        }
      }
    }
  }
`;

const HostTransactionsBase = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const intl = useIntl();
  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);
  const { data: metaData } = useQuery(hostTransactionsMetaDataQuery, {
    variables: { slug: hostSlug },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-first',
  });

  const views = [
    {
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
      id: 'all',
    },
    {
      label: intl.formatMessage({ id: 'HostedCollectives', defaultMessage: 'Hosted Collectives' }),
      filter: { excludeAccount: hostSlug },
      id: 'hosted_collectives',
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Fiscal Host', id: 'Fiscalhost' }),
      filter: { account: hostSlug },
      id: 'fiscal_host',
    },
  ];
  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters,
    meta: {
      currency: metaData?.host?.currency,
      kinds: metaData?.transactions?.kinds,
      hostSlug: hostSlug,
      paymentMethodTypes: metaData?.transactions?.paymentMethodTypes,
    },
    views,
  });

  const { data, error, loading, refetch } = useQuery(transactionsTableQuery, {
    variables: {
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: true,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
  });
  const { transactions } = data || {};

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="menu.transactions" defaultMessage="Transactions" />}
        actions={
          <React.Fragment>
            <ExportTransactionsCSVModal
              open={displayExportCSVModal}
              setOpen={setDisplayExportCSVModal}
              queryFilter={queryFilter}
              account={metaData?.host}
              isHostReport
              trigger={
                <Button size="sm" variant="outline" onClick={() => setDisplayExportCSVModal(true)}>
                  <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
                </Button>
              }
            />
          </React.Fragment>
        }
      />

      <Filterbar {...queryFilter} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !transactions?.nodes?.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="TRANSACTIONS"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <TransactionsTable
            transactions={transactions}
            loading={loading}
            nbPlaceholders={20}
            queryFilter={queryFilter}
            refetchList={refetch}
          />
        </React.Fragment>
      )}
    </div>
  );
};

// TODO: This redirection layer should be removed after some time. Should be safe to do after 2025-10-01.
const HostTransactions = props => {
  const router = useRouter();
  if (router.query.subpath?.[0] === 'import') {
    return (
      <div className="flex justify-center py-12">
        <Card>
          <CardContent className="flex max-w-xl flex-col items-center justify-center gap-6 pt-4 text-center">
            <Image src="/static/images/not-found-illustration.png" alt="" width={200} height={200} />
            <div>
              This page has moved, please go to the new{' '}
              <Link className="text-blue-600 underline" href={getOffPlatformTransactionsRoute(props.accountSlug)}>
                Off-platform Transactions tool
              </Link>{' '}
              to continue.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    return <HostTransactionsBase {...props} />;
  }
};

export default HostTransactions;
