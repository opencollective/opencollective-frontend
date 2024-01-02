import { isIndividualAccount } from '../../../lib/collective';
import { getFilteredSectionsForCollective, getSectionsNames } from '../../../lib/collective-sections';
import { CollectiveType } from '../../../lib/constants/collectives';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { manageContributionsQuery } from '../../recurring-contributions/graphql/queries';
import {
  getTotalCollectiveContributionsQueryVariables,
  totalCollectiveContributionsQuery,
} from '../hero/HeroTotalCollectiveContributionsWithData';
import { getBudgetSectionQuery, getBudgetSectionQueryVariables } from '../sections/Budget';
import { budgetSectionContributionsQuery } from '../sections/Budget/ContributionsBudget';
import { budgetSectionExpenseQuery } from '../sections/Budget/ExpenseBudget';
import { conversationsSectionQuery, getConversationsSectionQueryVariables } from '../sections/Conversations';
import { getRecurringContributionsSectionQueryVariables } from '../sections/RecurringContributions';
import { getTransactionsSectionQueryVariables, transactionsSectionQuery } from '../sections/Transactions';
import { getUpdatesSectionQueryVariables, updatesSectionQuery } from '../sections/Updates';

export const preloadCollectivePageGraphqlQueries = async (client, collective) => {
  if (collective) {
    const { slug } = collective;
    const sections = getFilteredSectionsForCollective(collective);
    const sectionsNames = getSectionsNames(sections);
    const queries = [];
    const isIndividual = isIndividualAccount(collective) && !collective.isHost;
    if (sectionsNames.includes('budget')) {
      queries.push(
        client.query({
          query: getBudgetSectionQuery(Boolean(collective.host), isIndividual),
          variables: getBudgetSectionQueryVariables(slug, isIndividual),
          context: API_V2_CONTEXT,
        }),
      );
      // V2
      const budget = sections.find(el => el.name === 'BUDGET')?.sections.find(el => el.name === 'budget');
      if (budget?.version === 2) {
        queries.push(
          client.query({
            query: budgetSectionExpenseQuery,
            variables: { slug, from: null, to: null },
            context: API_V2_CONTEXT,
          }),
        );
        queries.push(
          client.query({
            query: budgetSectionContributionsQuery,
            variables: { slug, from: null, to: null },
            context: API_V2_CONTEXT,
          }),
        );
      }
    }

    if (sectionsNames.includes('transactions')) {
      queries.push(
        client.query({
          query: transactionsSectionQuery,
          variables: getTransactionsSectionQueryVariables(slug),
          context: API_V2_CONTEXT,
        }),
      );
    }
    if (sectionsNames.includes('recurring-contributions')) {
      queries.push(
        client.query({
          query: manageContributionsQuery,
          variables: getRecurringContributionsSectionQueryVariables(slug),
          context: API_V2_CONTEXT,
        }),
      );
    }
    if (sectionsNames.includes('updates')) {
      queries.push(
        client.query({
          query: updatesSectionQuery,
          variables: getUpdatesSectionQueryVariables(slug),
          context: API_V2_CONTEXT,
        }),
      );
    }
    if (sectionsNames.includes('conversations')) {
      queries.push(
        client.query({
          query: conversationsSectionQuery,
          variables: getConversationsSectionQueryVariables(slug),
          context: API_V2_CONTEXT,
        }),
      );
    }
    const isCollective = collective.type === CollectiveType.COLLECTIVE;
    const isEvent = collective.type === CollectiveType.EVENT;
    if (!isCollective && !isEvent && !collective.isHost) {
      queries.push(
        client.query({
          query: totalCollectiveContributionsQuery,
          variables: getTotalCollectiveContributionsQueryVariables(slug),
        }),
      );
    }
    await Promise.all(queries);
  }
};
