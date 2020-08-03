import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/react-hooks';
import { mapValues } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import { parseAmountRange } from '../expenses/filters/ExpensesAmountFilter';
import { getDateRangeFromPeriod } from '../expenses/filters/ExpensesDateFilter';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import MessageBox from '../MessageBox';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledHr from '../StyledHr';
import { H1 } from '../Text';

import TransactionsDownloadCSV from './TransactionsDownloadCSV';
import TransactionsDownloadInvoices from './TransactionsDownloadInvoices';
import TransactionsFilters from './TransactionsFilters';
import TransactionsList from './TransactionsList';

const transactionsQuery = gqlV2/* GraphQL */ `
  query Transactions(
    $slug: String!
    $limit: Int!
    $offset: Int!
    $type: TransactionType
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: ISODateTime
    $searchTerm: String
  ) {
    transactions(
      account: { slug: $slug }
      limit: $limit
      offset: $offset
      type: $type
      minAmount: $minAmount
      maxAmount: $maxAmount
      dateFrom: $dateFrom
      searchTerm: $searchTerm
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        uuid
        amount {
          currency
          valueInCents
        }
        netAmount {
          currency
          valueInCents
        }
        platformFee {
          currency
          valueInCents
        }
        paymentProcessorFee {
          currency
          valueInCents
        }
        hostFee {
          currency
          valueInCents
        }
        type
        description
        createdAt
        isRefunded
        toAccount {
          id
          name
          slug
          type
          imageUrl
          ... on Collective {
            host {
              name
              slug
              type
            }
          }
        }
        fromAccount {
          id
          name
          slug
          type
          imageUrl
        }
        order {
          id
          status
          paymentMethod {
            type
          }
        }
        expense {
          id
          status
          tags
          type
          legacyId
          comments {
            totalCount
          }
          payoutMethod {
            type
          }
          account {
            slug
          }
          createdByAccount {
            slug
          }
        }
      }
    }
  }
`;

const EXPENSES_PER_PAGE = 15;

const getVariablesFromQuery = query => {
  const amountRange = parseAmountRange(query.amount);
  const [dateFrom] = getDateRangeFromPeriod(query.period);
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || EXPENSES_PER_PAGE,
    type: query.type,
    status: query.status,
    tags: query.tag ? [query.tag] : undefined,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    payoutMethodType: query.payout,
    dateFrom,
    searchTerm: query.searchTerm,
  };
};

const Transactions = ({ collective, LoggedInUser }) => {
  const { query } = useRouter() || {};
  const { data, error, loading, variables } = useQuery(transactionsQuery, {
    variables: { slug: collective.slug, ...getVariablesFromQuery(query) },
    context: API_V2_CONTEXT,
  });
  const hasFilters = React.useMemo(
    () =>
      Object.entries(query).some(([key, value]) => {
        return !['view', 'offset', 'limit', 'slug'].includes(key) && value;
      }),
    [query],
  );

  const isHostAdmin = LoggedInUser?.isHostAdmin(collective);
  const isCollectiveAdmin = LoggedInUser?.canEditCollective(collective);
  const canDownloadInvoices =
    isHostAdmin || (isCollectiveAdmin && (collective.type === 'ORGANIZATION' || collective.type === 'USER'));

  return (
    <Box maxWidth={1000} m="0 auto" py={[0, 5]} px={2}>
      <Flex justifyContent="space-between">
        <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal" display={['none', 'block']}>
          <FormattedMessage id="section.transactions.title" defaultMessage="Transactions" />
        </H1>
        <Box p={2} flexGrow={[1, 0]}>
          <SearchBar
            defaultValue={query.searchTerm}
            onSubmit={searchTerm => Router.pushRoute('transactions', { ...query, searchTerm, offset: null })}
          />
        </Box>
      </Flex>
      <StyledHr my="24px" mx="8px" borderWidth="0.5px" />
      <Flex
        mb={['8px', '46px']}
        mx="8px"
        justifyContent="space-between"
        flexDirection={['column', 'row']}
        alignItems={['stretch', 'flex-end']}
      >
        <TransactionsFilters
          filters={query}
          collective={collective}
          onChange={queryParams =>
            Router.pushRoute('transactions', {
              ...query,
              ...queryParams,
              offset: null,
            })
          }
        />
        <Flex>
          {canDownloadInvoices && (
            <Box mr="8px">
              <TransactionsDownloadInvoices collective={collective} />
            </Box>
          )}
          <TransactionsDownloadCSV collective={collective} />
        </Flex>
      </Flex>
      {error ? (
        <MessageBox type="error" withIcon>
          {getErrorFromGraphqlException(error).message}
        </MessageBox>
      ) : !loading && !data.transactions?.nodes.length ? (
        <MessageBox type="info" withIcon data-cy="zero-transactions-message">
          {hasFilters ? (
            <FormattedMessage
              id="TransactionsList.Empty"
              defaultMessage="No transaction matches the given filters, <ResetLink>reset them</ResetLink> to see all transactions."
              values={{
                ResetLink(text) {
                  return (
                    <Link
                      data-cy="reset-transactions-filters"
                      route="transactions"
                      params={{
                        ...mapValues(query, () => null),
                        collectiveSlug: collective.slug,
                        view: 'transactions',
                      }}
                    >
                      {text}
                    </Link>
                  );
                },
              }}
            />
          ) : (
            <FormattedMessage id="transactions.empty" defaultMessage="No transactions" />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          <TransactionsList
            isLoading={loading}
            nbPlaceholders={variables.limit}
            transactions={data?.transactions?.nodes}
          />
          <Flex mt={5} justifyContent="center">
            <Pagination
              route="transactions"
              total={data?.transactions?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              scrollToTopOnChange
            />
          </Flex>
        </React.Fragment>
      )}
    </Box>
  );
};

Transactions.propTypes = {
  /** Collective */
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    platformFeePercent: PropTypes.number,
  }).isRequired,
  /** @ignore from injectIntl */
  intl: PropTypes.object,
  LoggedInUser: PropTypes.object,
};

export default Transactions;
