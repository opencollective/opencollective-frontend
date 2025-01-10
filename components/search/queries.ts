import { gql } from '@apollo/client';

const searchAccountFieldsFragment = gql`
  fragment SearchAccountFields on Account {
    id
    name
    slug
    imageUrl(height: $imageHeight)
    type
  }
`;

export const searchCommandQuery = gql`
  query SearchCommand(
    $searchTerm: String!
    $host: AccountReferenceInput
    $account: AccountReferenceInput
    $limit: Int!
    $includeTransactions: Boolean!
    $imageHeight: Int
  ) {
    search(searchTerm: $searchTerm, defaultLimit: $limit, host: $host, account: $account) {
      results {
        accounts {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchAccountFields
            }
          }
        }
        comments {
          highlights
          collection {
            totalCount
            limit
            nodes {
              id
              html
              createdAt
              fromAccount {
                ...SearchAccountFields
              }
              expense {
                id
                legacyId
                description
                account {
                  ...SearchAccountFields
                }
              }
              update {
                id
                legacyId
                title
                account {
                  ...SearchAccountFields
                }
              }
              order {
                id
                legacyId
                toAccount {
                  ...SearchAccountFields
                }
              }
              hostApplication {
                id
                account {
                  ...SearchAccountFields
                }
                host {
                  ...SearchAccountFields
                }
              }
              conversation {
                id
                slug
                account {
                  ...SearchAccountFields
                }
              }
            }
          }
        }
        expenses {
          highlights
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
                ...SearchAccountFields
              }
              account {
                ...SearchAccountFields
              }
            }
          }
        }
        orders @include(if: $includeTransactions) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              id
              legacyId
              description
              status
              amount {
                valueInCents
                currency
              }
              toAccount {
                ...SearchAccountFields
              }
              fromAccount {
                ...SearchAccountFields
              }
            }
          }
        }
        transactions @include(if: $includeTransactions) {
          highlights
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
                ...SearchAccountFields
              }
              oppositeAccount {
                ...SearchAccountFields
              }
            }
          }
        }

        updates {
          highlights
          collection {
            totalCount
            limit
            nodes {
              id
              legacyId
              title
              account {
                ...SearchAccountFields
              }
            }
          }
        }
      }
    }
  }
  ${searchAccountFieldsFragment}
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
