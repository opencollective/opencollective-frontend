import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { GraphQLContext } from '../../../lib/graphql/context';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { Box } from '../../Grid';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledFilters from '../../StyledFilters';
import { transactionsQueryCollectionFragment } from '../../transactions/graphql/fragments';
import TransactionsList from '../../transactions/TransactionsList';
import { Dimensions } from '../_constants';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

const NB_DISPLAYED = 10;
const FILTERS = { ALL: 'ALL', EXPENSES: 'EXPENSES', CONTRIBUTIONS: 'CONTRIBUTIONS' };
const FILTERS_LIST = Object.values(FILTERS);
const I18nFilters = defineMessages({
  [FILTERS.ALL]: {
    id: 'SectionTransactions.All',
    defaultMessage: 'All',
  },
  [FILTERS.EXPENSES]: {
    id: 'section.expenses.title',
    defaultMessage: 'Expenses',
  },
  [FILTERS.CONTRIBUTIONS]: {
    id: 'Contributions',
    defaultMessage: 'Contributions',
  },
});

export const transactionsSectionQuery = gqlV2/* GraphQL */ `
  query TransactionsSection($slug: String!, $limit: Int!, $hasOrder: Boolean, $hasExpense: Boolean) {
    transactions(account: { slug: $slug }, limit: $limit, hasOrder: $hasOrder, hasExpense: $hasExpense) {
      ...TransactionsQueryCollectionFragment
    }
  }
  ${transactionsQueryCollectionFragment}
`;

export const getTransactionsSectionQueryVariables = slug => {
  return { slug, limit: NB_DISPLAYED };
};

const ResetAnchor = styled.a`
  cursor: pointer;
`;

const SectionTransactions = props => {
  const transactionsQueryResult = useQuery(transactionsSectionQuery, {
    variables: getTransactionsSectionQueryVariables(props.collective.slug),
    context: API_V2_CONTEXT,
    // We keep notifyOnNetworkStatusChange to remove the flash of collectiveHasNoTransactions bug
    // See https://github.com/apollographql/apollo-client/blob/9c80adf65ccbbb88ea5b9313c002f85976c225e3/src/core/ObservableQuery.ts#L274-L304
    notifyOnNetworkStatusChange: true,
  });
  const { data, refetch, loading } = transactionsQueryResult;
  const [filter, setFilter] = React.useState(FILTERS.ALL);
  React.useEffect(() => {
    refetch();
  }, [props.isAdmin, props.isRoot, refetch]);
  React.useEffect(() => {
    const hasExpense = filter === FILTERS.EXPENSES || undefined;
    const hasOrder = filter === FILTERS.CONTRIBUTIONS || undefined;
    refetch({ slug: props.collective.slug, limit: NB_DISPLAYED, hasExpense, hasOrder });
  }, [filter, props.collective.slug, refetch]);

  const { intl, collective } = props;
  const collectiveHasNoTransactions = !loading && data?.transactions?.totalCount === 0 && filter === FILTERS.ALL;

  return (
    <Box pb={4}>
      <ContainerSectionContent>
        <SectionTitle
          data-cy="section-transactions-title"
          mb={4}
          textAlign="left"
          fontSize={['20px', '24px', '32px']}
          color="black.700"
        >
          <FormattedMessage id="SectionTransactions.Title" defaultMessage="Transactions" />
        </SectionTitle>
        {collectiveHasNoTransactions && (
          <MessageBox type="info" withIcon>
            <FormattedMessage id="SectionTransactions.Empty" defaultMessage="No transactions yet." />
          </MessageBox>
        )}
      </ContainerSectionContent>
      {!collectiveHasNoTransactions && (
        <Box mb={3} maxWidth={Dimensions.MAX_SECTION_WIDTH} mx="auto">
          <StyledFilters
            filters={FILTERS_LIST}
            selected={filter}
            onChange={setFilter}
            getLabel={filter => intl.formatMessage(I18nFilters[filter])}
            minButtonWidth={180}
            px={Dimensions.PADDING_X}
          />
        </Box>
      )}

      {!collectiveHasNoTransactions && (
        <ContainerSectionContent pt={3}>
          {loading ? (
            <LoadingPlaceholder height={600} borderRadius={8} />
          ) : (
            <GraphQLContext.Provider value={transactionsQueryResult}>
              <TransactionsList collective={collective} transactions={data?.transactions?.nodes} displayActions />
            </GraphQLContext.Provider>
          )}
          {data?.transactions.totalCount === 0 && (
            <MessageBox type="info">
              <FormattedMessage
                id="TransactionsList.Empty"
                defaultMessage="No transactions found. <ResetLink>Reset filters</ResetLink> to see all transactions."
                values={{
                  ResetLink(text) {
                    return <ResetAnchor onClick={() => setFilter(FILTERS.ALL)}>{text}</ResetAnchor>;
                  },
                }}
              />
            </MessageBox>
          )}
          <Link route="transactions" params={{ collectiveSlug: collective.slug }}>
            <StyledButton mt={3} width="100%" buttonSize="small" fontSize="Paragraph">
              <FormattedMessage id="transactions.viewAll" defaultMessage="View All Transactions" /> →
            </StyledButton>
          </Link>
        </ContainerSectionContent>
      )}
    </Box>
  );
};

SectionTransactions.propTypes = {
  /** Collective */
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    platformFeePercent: PropTypes.number,
  }).isRequired,

  /** Wether user is admin of `collective` */
  isAdmin: PropTypes.bool,

  /** Wether user is root user */
  isRoot: PropTypes.bool,

  /** @ignore from withData */
  data: PropTypes.shape({
    loading: PropTypes.bool,
    refetch: PropTypes.func,
    transactions: PropTypes.arrayOf(PropTypes.object),
  }),

  /** @ignore from injectIntl */
  intl: PropTypes.object,
};

export default React.memo(injectIntl(SectionTransactions));
