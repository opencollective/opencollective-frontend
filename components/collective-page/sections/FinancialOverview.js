import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';

import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';

import { Flex } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import { PERIOD_FILTER_PRESETS } from '../../PeriodFilterPresetsSelect';
import { withUser } from '../../UserProvider';
import BudgetStats from '../BudgetStats';
import ContainerSectionContent from '../ContainerSectionContent';

import ContributionsBudget from './Budget/ContributionsBudget';
import ExpenseBudget from './Budget/ExpenseBudget';

export const budgetSectionQuery = gql`
  query BudgetSection($slug: String!, $heavyAccount: Boolean!) {
    account(slug: $slug) {
      id
      stats {
        id
        balance {
          valueInCents
          currency
        }
        consolidatedBalance @skip(if: $heavyAccount) {
          valueInCents
          currency
        }
        yearlyBudget @skip(if: $heavyAccount) {
          valueInCents
          currency
        }
        activeRecurringContributions
        totalAmountReceived(periodInMonths: 12) @skip(if: $heavyAccount) {
          valueInCents
          currency
        }
        totalAmountRaised: totalAmountReceived {
          valueInCents
          currency
        }
        totalNetAmountRaised: totalNetAmountReceived {
          valueInCents
          currency
        }
      }
    }
  }
`;

/**
 * The budget section. Shows the expenses, the latest transactions and some statistics
 * abut the global budget of the collective.
 */
const SectionFinancialOverview = ({ collective, LoggedInUser }) => {
  const budgetQueryResult = useQuery(budgetSectionQuery, {
    variables: {
      slug: collective.slug,
      heavyAccount: ['opencollective', 'opensource', 'foundation', 'europe'].includes(collective.slug),
    },
    context: API_V2_CONTEXT,
  });
  const { data, refetch } = budgetQueryResult;

  const isLoading = budgetQueryResult.loading;
  const defaultTimeInterval = PERIOD_FILTER_PRESETS.allTime.getInterval();

  // Refetch data when user logs in to refresh permissions
  React.useEffect(() => {
    if (LoggedInUser) {
      refetch();
    }
  }, [LoggedInUser]);

  return (
    <ContainerSectionContent pb={4}>
      {isLoading ? (
        <LoadingPlaceholder height={300} />
      ) : (
        <BudgetStats collective={collective} stats={data?.account?.stats} horizontal />
      )}
      <Flex flexDirection={['column', null, 'row']} alignItems="flex-start" gap={'48px'}>
        <ExpenseBudget
          collective={collective}
          defaultTimeInterval={defaultTimeInterval}
          mt={4}
          flexDirection="column"
          flexGrow={1}
          maxWidth={['100%', null, '50%']}
          width={['100%', null, 'auto']}
        />
        <ContributionsBudget
          collective={collective}
          defaultTimeInterval={defaultTimeInterval}
          mt={4}
          flexDirection="column"
          flexGrow={1}
          maxWidth={['initial', null, '50%']}
          width={['100%', null, 'auto']}
        />
      </Flex>
    </ContainerSectionContent>
  );
};

SectionFinancialOverview.propTypes = {
  /** Collective */
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    isArchived: PropTypes.bool,
    settings: PropTypes.object,
    host: PropTypes.object,
  }),

  LoggedInUser: PropTypes.object,
};

export default React.memo(withUser(SectionFinancialOverview));
