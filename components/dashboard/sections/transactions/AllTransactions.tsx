import React from 'react';
import { useQuery } from '@apollo/client';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { TransactionsTableQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import type { Currency } from '@/lib/graphql/types/v2/schema';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ExportTransactionsCSVModal from '../../ExportTransactionsCSVModal';
import { accountingCategoryFilter } from '../../filters/AccountingCategoryFilter';
import { DateFilterType, Period } from '../../filters/DateFilter/schema';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';

import type { FilterMeta as CommonFilterMeta } from './filters';
import { filters as commonFilters, schema as commonSchema, toVariables as commonToVariables } from './filters';
import { transactionsTableQuery } from './queries';
import TransactionsTable from './TransactionsTable';

const schema = commonSchema.extend({
  account: hostedAccountFilter.schema,
  excludeAccount: z.string().optional(),
  accountingCategory: accountingCategoryFilter.schema,
});

type FilterValues = z.infer<typeof schema>;

type FilterMeta = CommonFilterMeta & {
  hostSlug?: string;
  currency?: Currency;
};

// Only needed when values and key of filters are different
// to expected key and value of QueryVariables
const toVariables: FiltersToVariables<FilterValues, TransactionsTableQueryVariables, FilterMeta> = {
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

const AllTransactions = () => {
  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters,
    meta: { currency: 'USD' as Currency },
    defaultFilterValues: {
      date: {
        number: 1,
        period: Period.DAYS,
        type: DateFilterType.IN_LAST_PERIOD,
        tz: 'UTC',
      },
    },
  });

  const { data, error, loading, refetch } = useQuery(transactionsTableQuery, {
    variables: {
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
          <ExportTransactionsCSVModal
            open={displayExportCSVModal}
            setOpen={setDisplayExportCSVModal}
            queryFilter={queryFilter}
            isHostReport
            trigger={
              <Button size="sm" variant="outline" onClick={() => setDisplayExportCSVModal(true)}>
                <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
              </Button>
            }
          />
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

export default AllTransactions;
