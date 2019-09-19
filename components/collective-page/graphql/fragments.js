import gql from 'graphql-tag';
import { BudgetItemExpenseTypeFragment, BudgetItemOrderFragment } from '../../BudgetItemsList';

/**
 * Query the transactions and expenses for the collective, to show in the
 * "Budget" section.
 */
export const TransactionsAndExpensesFragment = gql`
  fragment TransactionsAndExpensesFragment on Collective {
    transactions(limit: 3) {
      ...BudgetItemOrderFragment
    }
    expenses(limit: 3) {
      ...BudgetItemExpenseTypeFragment
    }
  }
  ${BudgetItemOrderFragment}
  ${BudgetItemExpenseTypeFragment}
`;

/**
 * Fields fetched for updates
 */
export const UpdatesFieldsFragment = gql`
  fragment UpdatesFieldsFragment on UpdateType {
    id
    slug
    title
    summary
    createdAt
    publishedAt
    isPrivate
    userCanSeeUpdate
    fromCollective {
      id
      type
      name
      slug
      imageUrl
    }
  }
`;

/**
 * Fields fetched for contributors
 */
export const ContributorsFieldsFragment = gql`
  fragment ContributorsFieldsFragment on Contributor {
    id
    name
    roles
    isAdmin
    isCore
    isBacker
    since
    image
    description
    collectiveSlug
    totalAmountDonated
    type
    publicMessage
    isIncognito
    tiersIds
  }
`;
