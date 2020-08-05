import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { Dimensions } from '../_constants';
import { Box } from '../../Grid';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledFilters from '../../StyledFilters';
import { transactionsQueryCollectionFragment } from '../../transactions/graphql/fragments';
import TransactionsList from '../../transactions/TransactionsList';
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

const SectionTransactions = props => {
  const [filter, setFilter] = React.useState(FILTERS.ALL);
  React.useEffect(() => {
    props.data.refetch();
  }, [props.data, props.isAdmin, props.isRoot]);
  React.useEffect(() => {
    const hasExpense = filter === FILTERS.EXPENSES || undefined;
    const hasOrder = filter === FILTERS.CONTRIBUTIONS || undefined;
    props.data.refetch({ slug: props.collective.slug, limit: NB_DISPLAYED, hasExpense, hasOrder });
  }, [filter, props.collective.slug, props.data]);

  const { data, intl, collective } = props;
  const showFilters = data?.transactions?.length !== 0;

  if (!data?.transactions?.nodes?.length) {
    return (
      <ContainerSectionContent pt={5} pb={6}>
        <SectionTitle mb={4} fontSize={['H4', 'H2']}>
          <FormattedMessage id="SectionTransactions.Title" defaultMessage="Transactions" />
        </SectionTitle>
        <MessageBox type="info" withIcon>
          <FormattedMessage id="SectionTransactions.Empty" defaultMessage="No transaction yet." />
        </MessageBox>
      </ContainerSectionContent>
    );
  }

  return (
    <Box py={5}>
      <ContainerSectionContent>
        <SectionTitle data-cy="section-transactions-title" mb={4} textAlign="left">
          <FormattedMessage id="SectionTransactions.Title" defaultMessage="Transactions" />
        </SectionTitle>
      </ContainerSectionContent>
      {showFilters && (
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

      <ContainerSectionContent>
        {data.loading ? (
          <LoadingPlaceholder height={600} borderRadius={8} />
        ) : (
          <TransactionsList transactions={data?.transactions?.nodes} />
        )}
        <Link route="transactions" params={{ collectiveSlug: collective.slug }}>
          <StyledButton mt={3} width="100%" buttonSize="small" fontSize="Paragraph">
            <FormattedMessage id="transactions.viewAll" defaultMessage="View All Transactions" /> →
          </StyledButton>
        </Link>
      </ContainerSectionContent>
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

const transactionsQuery = gqlV2/* GraphQL */ `
  query Transactions($slug: String!, $limit: Int!, $hasOrder: Boolean, $hasExpense: Boolean) {
    transactions(account: { slug: $slug }, limit: $limit, hasOrder: $hasOrder, hasExpense: $hasExpense) {
      ...TransactionsQueryCollectionFragment
    }
  }
  ${transactionsQueryCollectionFragment}
`;

const addTransactionsSectionData = graphql(transactionsQuery, {
  options: props => {
    return {
      variables: { slug: props.collective.slug, limit: NB_DISPLAYED },
      context: API_V2_CONTEXT,
    };
  },
});

export default React.memo(injectIntl(addTransactionsSectionData(SectionTransactions)));
