import { gql } from '@apollo/client';

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
              id
              name
              slug
              imageUrl(height: $imageHeight)
              type
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
                id
                slug
                name
                imageUrl(height: $imageHeight)
                type
              }
              expense {
                id
                legacyId
                description
                account {
                  id
                  name
                  slug
                  imageUrl(height: $imageHeight)
                  type
                }
              }
              update {
                id
                legacyId
                title
                account {
                  id
                  slug
                  name
                  imageUrl(height: $imageHeight)
                  type
                }
              }
              order {
                id
                legacyId
                toAccount {
                  id
                  slug
                  name
                  imageUrl(height: $imageHeight)
                  type
                }
              }
              hostApplication {
                id
                account {
                  id
                  slug
                  name
                  imageUrl(height: $imageHeight)
                  type
                }
                host {
                  id
                  slug
                  name
                  imageUrl(height: $imageHeight)
                  type
                }
              }
              conversation {
                id
                slug
                account {
                  id
                  slug
                  name
                  imageUrl(height: $imageHeight)
                  type
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
                id
                name
                slug
                imageUrl(height: $imageHeight)
                type
              }
              account {
                id
                name
                slug
                imageUrl(height: $imageHeight)
                type
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
                id
                slug
                name
                imageUrl(height: $imageHeight)
                type
              }
              fromAccount {
                id
                slug
                name
                imageUrl(height: $imageHeight)
                type
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
                id
                slug
                name
                imageUrl(height: $imageHeight)
                type
              }
              oppositeAccount {
                id
                slug
                name
                imageUrl(height: $imageHeight)
                type
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
                id
                slug
                name
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
