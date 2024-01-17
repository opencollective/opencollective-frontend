// This is the "legacy" version of the transactions page in Dashboard, will likely be replaced by the new version in /components/dashboard/sections/transactions
import React from 'react';
import { useQuery } from '@apollo/client';
import { uniq } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { FilterComponentConfigs, FiltersToVariables } from '../../../lib/filters/filter-types';
import { isMulti, isNullable, limit, offset } from '../../../lib/filters/schemas';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import {
  Currency,
  PaymentMethodType,
  TransactionKind,
  TransactionsPageQueryVariables,
  TransactionType,
} from '../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';
import { i18nPaymentMethodType } from '../../../lib/i18n/payment-method-type';
import { i18nTransactionKind, i18nTransactionType } from '../../../lib/i18n/transaction';
import { sortSelectOptions } from '../../../lib/utils';

import { transactionsPageQuery } from '../../../pages/transactions';
import { Flex } from '../../Grid';
import Link from '../../Link';
import Loading from '../../Loading';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import Pagination from '../../Pagination';
import { getDefaultKinds } from '../../transactions/filters/TransactionsKindFilter';
import TransactionsList from '../../transactions/TransactionsList';
import { Button } from '../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/DropdownMenu';
import DashboardHeader from '../DashboardHeader';
import { EmptyResults } from '../EmptyResults';
import ExportTransactionsCSVModal from '../ExportTransactionsCSVModal';
import { amountFilter } from '../filters/AmountFilter';
import ComboSelectFilter from '../filters/ComboSelectFilter';
import { dateFilter } from '../filters/DateFilter';
import { Filterbar } from '../filters/Filterbar';
import { orderByFilter } from '../filters/OrderFilter';
import { searchFilter } from '../filters/SearchFilter';
import { VirtualCardRenderer } from '../filters/VirtualCardsFilter';
import { DashboardSectionProps } from '../types';

const schema = z.object({
  limit: limit.default(20),
  offset,
  date: dateFilter.schema,
  amount: amountFilter.schema,
  orderBy: orderByFilter.schema,
  searchTerm: searchFilter.schema,
  kind: isMulti(z.nativeEnum(TransactionKind)).optional(),
  type: z.nativeEnum(TransactionType).optional(),
  paymentMethodType: isMulti(isNullable(z.nativeEnum(PaymentMethodType))).optional(),
  virtualCard: isMulti(z.string()).optional(),
});

type FilterValues = z.infer<typeof schema>;

type FilterMeta = {
  currency?: Currency;
  paymentMethodTypes?: PaymentMethodType[];
  kinds?: TransactionKind[];
};

// Only needed when values and key of filters are different
// to expected key and value of QueryVariables
const toVariables: FiltersToVariables<FilterValues, TransactionsPageQueryVariables, FilterMeta> = {
  orderBy: orderByFilter.toVariables,
  date: dateFilter.toVariables,
  amount: amountFilter.toVariables,
  virtualCard: (virtualCardIds, key) => ({ [key]: virtualCardIds.map(id => ({ id })) }),
};

// The filters config is used to populate the Filters component.
const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  searchTerm: searchFilter.filter,
  date: dateFilter.filter,
  amount: amountFilter.filter,
  orderBy: orderByFilter.filter,
  type: {
    labelMsg: defineMessage({ id: 'Type', defaultMessage: 'Type' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(TransactionType).map(value => ({ label: i18nTransactionType(intl, value), value }))}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nTransactionType(intl, value),
  },
  kind: {
    labelMsg: defineMessage({ id: 'Transaction.Kind', defaultMessage: 'Kind' }),
    Component: ({ meta, intl, ...props }) => {
      const kinds = uniq([...(meta?.kinds || []), ...getDefaultKinds()]);
      return (
        <ComboSelectFilter
          isMulti
          options={kinds
            .map(value => ({
              label: i18nTransactionKind(intl, value),
              value,
            }))
            .sort(sortSelectOptions)}
          {...props}
        />
      );
    },
    valueRenderer: ({ value, intl }) => i18nTransactionKind(intl, value),
  },
  paymentMethodType: {
    labelMsg: defineMessage({ id: 'Fields.paymentMethod', defaultMessage: 'Payment method' }),
    Component: ({ value, meta, intl, ...props }) => {
      const paymentMethodTypes = meta?.paymentMethodTypes || PaymentMethodType;
      return (
        <ComboSelectFilter
          isMulti
          value={value?.map(v => String(v))} // Turn into string to make the `null` value work with the component
          options={Object.values(paymentMethodTypes).map(value => ({
            label: i18nPaymentMethodType(intl, value),
            value: String(value),
          }))}
          {...props}
        />
      );
    },
    valueRenderer: ({ value, intl }) => i18nPaymentMethodType(intl, value),
  },
  virtualCard: {
    labelMsg: defineMessage({ id: 'PayoutMethod.Type.VirtualCard', defaultMessage: 'Virtual Card' }),
    valueRenderer: ({ value }) => <VirtualCardRenderer id={value} />,
  },
};

const transactionsMetaDataQuery = gql`
  query TransactionsMetaData($slug: String!) {
    transactions(account: { slug: $slug }, limit: 0) {
      paymentMethodTypes
      kinds
    }
    account(slug: $slug) {
      id
      legacyId
      slug
      currency
    }
  }
`;

const Transactions = ({ accountSlug }: DashboardSectionProps) => {
  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);
  const router = useRouter();
  const { data: metaData } = useQuery(transactionsMetaDataQuery, {
    variables: { slug: accountSlug },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-first',
  });

  const defaultFilterValues = {
    kind: getDefaultKinds() as TransactionKind[],
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters,
    meta: {
      currency: metaData?.account?.currency,
      paymentMethodTypes: metaData?.transactions?.paymentMethodTypes,
      kinds: metaData?.transactions?.kinds,
    },
    defaultFilterValues,
  });
  const { data, error, loading, refetch } = useQuery(transactionsPageQuery, {
    variables: { slug: accountSlug, ...queryFilter.variables },
    context: API_V2_CONTEXT,
  });
  const { transactions, account } = data || {};

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="menu.transactions" defaultMessage="Transactions" />}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="items-center gap-1 ">
                <FormattedMessage id="editCollective.menu.export" defaultMessage="Export" />
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/${accountSlug}/payment-receipts`)}>
                <Link href={`/dashboard/${accountSlug}/payment-receipts`}>
                  <FormattedMessage id="transactions.downloadinvoicesbutton" defaultMessage="Download Receipts" />
                </Link>
              </DropdownMenuItem>
              <ExportTransactionsCSVModal
                open={displayExportCSVModal}
                setOpen={setDisplayExportCSVModal}
                queryFilter={queryFilter}
                accountSlug={accountSlug}
                trigger={
                  <DropdownMenuItem
                    onSelect={event => {
                      event.preventDefault();
                      setDisplayExportCSVModal(true);
                    }}
                  >
                    <FormattedMessage defaultMessage="Export CSV" />
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
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
      ) : loading ? (
        <Flex p="32px" justifyContent="center">
          <Loading />
        </Flex>
      ) : (
        <React.Fragment>
          <TransactionsList
            collective={account}
            transactions={transactions.nodes}
            displayActions
            onMutationSuccess={() => refetch()}
          />
          <Flex mt={5} justifyContent="center">
            <Pagination
              route={`/${account.slug}/transactions`}
              total={transactions?.totalCount}
              limit={queryFilter.values.limit}
              offset={queryFilter.values.offset}
              ignoredQueryParams={['collectiveSlug']}
            />
          </Flex>
        </React.Fragment>
      )}
    </div>
  );
};

export default Transactions;
