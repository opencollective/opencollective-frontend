import { gql } from '@apollo/client/core';

import { managedOrderFragment } from '../../../recurring-contributions/graphql/queries';

export const manageContributionModalQuery = gql`
  query ManageContributionModal($order: OrderReferenceInput!) {
    order(order: $order) {
      id
      status
      frequency
      description
      amount {
        valueInCents
        currency
      }
      totalAmount {
        valueInCents
        currency
      }
      fromAccount {
        id
        slug
        name
        imageUrl
        type
      }
      toAccount {
        id
        slug
        name
        ... on AccountWithHost {
          host {
            id
            slug
            name
          }
        }
        ... on Organization {
          host {
            id
            slug
            name
          }
        }
      }
      transactions {
        id
        legacyId
        createdAt
        isRefunded
        isRefund
        amount {
          valueInCents
          currency
        }
        paymentProcessorFee {
          valueInCents
          currency
        }
        hostFee {
          valueInCents
          currency
        }
        permissions {
          id
          canRefund
        }
      }
    }
  }
`;

export const manageOrderMutation = gql`
  mutation ManageOrder($order: OrderReferenceInput!, $action: ManageOrderInput!) {
    manageOrder(order: $order, action: $action) {
      order {
        id
        status
        ...ManagedOrderFields
      }
      refundedTransactions {
        id
        legacyId
      }
      refundErrors {
        code
        message
        transaction {
          id
          legacyId
        }
      }
    }
  }
  ${managedOrderFragment}
`;

export const dashboardOrdersQuery = gql`
  query DashboardOrders(
    $slug: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $filter: AccountOrdersFilter!
    $frequency: [ContributionFrequency]
    $status: [OrderStatus!]
    $includeIncognito: Boolean
    $amount: AmountRangeInput
    $paymentMethod: [PaymentMethodReferenceInput]
    $paymentMethodService: [PaymentMethodService]
    $paymentMethodType: [PaymentMethodType]
    $manualPaymentProvider: [ManualPaymentProviderReferenceInput!]
    $accountingCategory: [String]
    $hostContext: HostContext
    $includeChildrenAccounts: Boolean
    $dateFrom: DateTime
    $dateTo: DateTime
    $expectedDateFrom: DateTime
    $expectedDateTo: DateTime
    $chargedDateFrom: DateTime
    $chargedDateTo: DateTime
    $expectedFundsFilter: ExpectedFundsFilter
    $orderBy: ChronologicalOrderInput
    $tier: [TierReferenceInput!]
    $hostedAccounts: [AccountReferenceInput!]
    $createdBy: [AccountReferenceInput]
    $oppositeAccountScope: OppositeAccountScope
  ) {
    account(slug: $slug) {
      id
      orders(
        dateFrom: $dateFrom
        dateTo: $dateTo
        expectedDateFrom: $expectedDateFrom
        expectedDateTo: $expectedDateTo
        filter: $filter
        frequency: $frequency
        status: $status
        includeIncognito: $includeIncognito
        amount: $amount
        searchTerm: $searchTerm
        offset: $offset
        limit: $limit
        paymentMethod: $paymentMethod
        paymentMethodService: $paymentMethodService
        paymentMethodType: $paymentMethodType
        manualPaymentProvider: $manualPaymentProvider
        accountingCategory: $accountingCategory
        hostContext: $hostContext
        includeChildrenAccounts: $includeChildrenAccounts
        expectedFundsFilter: $expectedFundsFilter
        orderBy: $orderBy
        chargedDateFrom: $chargedDateFrom
        chargedDateTo: $chargedDateTo
        tier: $tier
        hostedAccounts: $hostedAccounts
        createdBy: $createdBy
        oppositeAccountScope: $oppositeAccountScope
      ) {
        totalCount
        nodes {
          id
          ...ManagedOrderFields
        }
      }
    }
  }
  ${managedOrderFragment}
`;
