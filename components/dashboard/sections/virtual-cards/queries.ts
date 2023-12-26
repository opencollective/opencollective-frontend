import { gql } from '../../../../lib/graphql/helpers';

export const accountVirtualCardsQuery = gql`
  query AccountVirtualCards(
    $slug: String
    $limit: Int!
    $offset: Int!
    $status: [VirtualCardStatus]
    $merchantAccount: AccountReferenceInput
    $dateFrom: DateTime
    $dateTo: DateTime
  ) {
    account(slug: $slug) {
      id
      legacyId
      slug
      type
      name
      imageUrl
      currency
      ... on AccountWithHost {
        isApproved
        host {
          legacyId
          slug
          id
          type
          name
          imageUrl
          settings
          currency
        }
      }
      virtualCards(
        limit: $limit
        offset: $offset
        status: $status
        merchantAccount: $merchantAccount
        dateFrom: $dateFrom
        dateTo: $dateTo
      ) {
        totalCount
        limit
        offset
        nodes {
          id
          name
          last4
          data
          currency
          provider
          privateData
          createdAt
          spendingLimitAmount
          spendingLimitInterval
          spendingLimitRenewsOn
          remainingLimit
          account {
            id
            slug
            name
            imageUrl
          }
          assignee {
            id
            name
            slug
            imageUrl
          }
        }
      }
      virtualCardMerchants {
        nodes {
          id
          type
          slug
          name
          currency
          location {
            id
            address
            country
          }
          imageUrl(height: 64)
        }
      }
    }
  }
`;
