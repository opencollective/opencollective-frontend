import { gql } from '@apollo/client';

export const searchCommandQuery = gql`
  query SearchCommand(
    $searchTerm: String!
    $host: AccountReferenceInput
    $account: AccountReferenceInput
    $limit: Int!
    $includeTransactions: Boolean!
  ) {
    search(searchTerm: $searchTerm, defaultLimit: $limit, host: $host, account: $account) {
      results {
        accounts {
          collection {
            totalCount
            limit
            nodes {
              id
              name
              slug
              imageUrl
              type
            }
          }
        }
        expenses {
          collection {
            totalCount
            limit
            nodes {
              id
              description
              legacyId
              type
              status
              amountV2 {
                valueInCents
                currency
              }
              payee {
                id
                name
                slug
                imageUrl
                type
              }
              account {
                id
                name
                slug
                imageUrl
                type
              }
            }
          }
        }
        transactions @include(if: $includeTransactions) {
          collection {
            totalCount
            limit
            nodes {
              id
              legacyId
              description
              type
              kind
              netAmount {
                valueInCents
                currency
              }
              account {
                id
                slug
                name
                imageUrl
                type
              }
              oppositeAccount {
                id
                slug
                name
                imageUrl
                type
              }
            }
          }
        }
      }
    }
  }
`;

export const contextQuery = gql`
  query SearchContext($slug: String!) {
    account(slug: $slug) {
      id
      name
      slug
      imageUrl
      type
    }
  }
`;
