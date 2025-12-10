import { isIndividualAccount } from '../../../lib/collective';
import { getFilteredSectionsForCollective, getSectionsNames } from '../../../lib/collective-sections';
import { CollectiveType } from '../../../lib/constants/collectives';
import { API_V1_CONTEXT } from '../../../lib/graphql/helpers';

import {
  getTotalCollectiveContributionsQueryVariables,
  totalCollectiveContributionsQuery,
} from '../hero/HeroTotalCollectiveContributionsWithData';
import { getBudgetSectionQuery, getBudgetSectionQueryVariables } from '../sections/Budget';
import { budgetSectionContributionsQuery } from '../sections/Budget/ContributionsBudget';
import { budgetSectionExpenseQuery } from '../sections/Budget/ExpenseBudget';
import { conversationsSectionQuery, getConversationsSectionQueryVariables } from '../sections/Conversations';
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
      const budget = sections.find(el => el.name === 'BUDGET')?.sections.find(el => el.name === 'budget');
      if (budget?.version === 2) {
        queries.push(
          client.query({
            query: budgetSectionExpenseQuery,
            variables: { slug, from: null, to: null },
          }),
        );
        queries.push(
          client.query({
            query: budgetSectionContributionsQuery,
            variables: { slug, from: null, to: null },
          }),
        );
      } else {
        queries.push(
          client.query({
            query: getBudgetSectionQuery(Boolean(collective.host), isIndividual),
            variables: getBudgetSectionQueryVariables(slug, isIndividual, collective.host),
          }),
        );
      }
    }

    if (sectionsNames.includes('transactions')) {
      queries.push(
        client.query({
          query: transactionsSectionQuery,
          variables: getTransactionsSectionQueryVariables(slug),
        }),
      );
    }
    if (sectionsNames.includes('updates')) {
      queries.push(
        client.query({
          query: updatesSectionQuery,
          variables: getUpdatesSectionQueryVariables(slug),
        }),
      );
    }
    if (sectionsNames.includes('conversations')) {
      queries.push(
        client.query({
          query: conversationsSectionQuery,
          variables: getConversationsSectionQueryVariables(slug),
        }),
      );
    }
    const isCollective = collective.type === CollectiveType.COLLECTIVE;
    const isEvent = collective.type === CollectiveType.EVENT;
    if (!isCollective && !isEvent && !collective.isHost) {
      queries.push(
        client.query({
          query: totalCollectiveContributionsQuery,
          context: API_V1_CONTEXT,
          variables: getTotalCollectiveContributionsQueryVariables(slug),
        }),
      );
    }
    await Promise.all(queries);
  }
};
