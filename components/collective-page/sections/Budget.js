import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { get, orderBy, isEmpty } from 'lodash';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';

import { formatCurrency } from '../../../lib/utils';
import { P, Span } from '../../Text';
import Container from '../../Container';
import StyledButton from '../../StyledButton';
import StyledCard from '../../StyledCard';
import Link from '../../Link';
import DefinedTerm, { Terms } from '../../DefinedTerm';
import MessageBox from '../../MessageBox';

import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';
import { TransactionsAndExpensesFragment } from '../graphql/fragments';
import BudgetItemsList from '../../BudgetItemsList';

/** Query to re-fetch transactions and expenses */
const TransactionsAndExpensesQuery = gql`
  query NewCollectivePage($slug: String!) {
    Collective(slug: $slug) {
      id
      ...TransactionsAndExpensesFragment
    }
  }

  ${TransactionsAndExpensesFragment}
`;

/**
 * The budget section. Shows the expenses, the latests transactions and some statistics
 * abut the global budget of the collective.
 */
const SectionBudget = ({ collective, stats }) => {
  return (
    <ContainerSectionContent pt={[4, 5]}>
      <SectionTitle>
        <FormattedMessage id="CollectivePage.SectionBudget.Title" defaultMessage="Budget" />
      </SectionTitle>
      <P color="black.600" mb={4} maxWidth={830}>
        <FormattedMessage
          id="CollectivePage.SectionBudget.Description"
          defaultMessage="See how money openly circulates through {collectiveName}. All contributions and all expenses are published in our transparent public ledger. Learn who is donating, how much, where is that money going, submit expenses, get reimbursed and more!"
          values={{ collectiveName: collective.name }}
        />
      </P>
      <Flex flexDirection={['column-reverse', null, 'row']} justifyContent="space-between" alignItems="flex-start">
        <Query query={TransactionsAndExpensesQuery} variables={{ slug: collective.slug }} pollInterval={60000}>
          {({ data }) => {
            const expenses = get(data, 'Collective.expenses');
            const transactions = get(data, 'Collective.transactions');
            if (isEmpty(expenses) && isEmpty(transactions)) {
              return (
                <MessageBox type="info" withIcon maxWidth={800} fontStyle="italic" fontSize="Paragraph">
                  <FormattedMessage
                    id="SectionBudget.Empty"
                    defaultMessage="No transaction or expense created yet. They'll start appearing here as soon as you get your first
                  financial contributors or when someone creates an expense."
                  />
                </MessageBox>
              );
            }

            // Merge items, filter expenses that already have a transaction as they'll already be
            // included in `transactions`.
            const budgetItemsUnsorted = [...transactions, ...expenses];
            const budgetItems = orderBy(budgetItemsUnsorted, i => new Date(i.createdAt), ['desc']).slice(0, 3);
            return (
              <Container flex="10" mb={3} width="100%" maxWidth={800}>
                <BudgetItemsList items={budgetItems} isCompact />
                <Flex flexWrap="wrap" justifyContent="space-between" mt={3}>
                  <Box flex="1 1" mx={[0, 2]}>
                    <Link route="transactions" params={{ collectiveSlug: collective.slug }}>
                      <StyledButton
                        data-cy="view-all-transactions-btn"
                        buttonSize="large"
                        my={2}
                        minWidth={290}
                        width="100%"
                        py="10px"
                      >
                        <FormattedMessage
                          id="CollectivePage.SectionBudget.ViewAll"
                          defaultMessage="View all transactions"
                        />
                      </StyledButton>
                    </Link>
                  </Box>
                  <Box flex="1 1" mx={[0, 2]}>
                    <Link route="expenses" params={{ collectiveSlug: collective.slug }}>
                      <StyledButton
                        data-cy="view-all-expenses-btn"
                        buttonSize="large"
                        my={2}
                        minWidth={290}
                        width="100%"
                        py="10px"
                      >
                        <FormattedMessage
                          id="CollectivePage.SectionBudget.ViewAllExpenses"
                          defaultMessage="View all expenses"
                        />
                      </StyledButton>
                    </Link>
                  </Box>
                </Flex>
              </Container>
            );
          }}
        </Query>

        <Box width="32px" flex="1" />

        <StyledCard
          display="flex"
          flex="1"
          width="100%"
          flexDirection={['column', 'row', 'column']}
          mb={2}
          mx={[null, null, 3]}
          minWidth={300}
        >
          <Box data-cy="budgetSection-today-balance" flex="1" py={16} px={4}>
            <P fontSize="Tiny" textTransform="uppercase" color="black.700">
              <FormattedMessage id="CollectivePage.SectionBudget.Balance" defaultMessage="Today’s balance" />
            </P>
            <P fontSize="H5" mt={1}>
              {formatCurrency(stats.balance, collective.currency)} <Span color="black.400">{collective.currency}</Span>
            </P>
          </Box>
          <Container data-cy="budgetSection-estimated-budget" flex="1" background="#F5F7FA" py={16} px={4}>
            <DefinedTerm term={Terms.ESTIMATED_BUDGET} fontSize="Tiny" textTransform="uppercase" color="black.700" />
            <P fontSize="H5" mt={2}>
              <Span fontWeight="bold">~ {formatCurrency(stats.yearlyBudget, collective.currency)}</Span>{' '}
              <Span color="black.400">{collective.currency}</Span>
            </P>
          </Container>
        </StyledCard>
      </Flex>
    </ContainerSectionContent>
  );
};

SectionBudget.propTypes = {
  /** Collective */
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    isArchived: PropTypes.bool,
  }),

  /** Stats */
  stats: PropTypes.shape({
    balance: PropTypes.number.isRequired,
    yearlyBudget: PropTypes.number.isRequired,
  }),

  /** @ignore from injectIntl */
  intl: PropTypes.object,
};

export default React.memo(injectIntl(SectionBudget));
