import { gql } from '@apollo/client/core';

import { managedOrderFragment } from '../../../recurring-contributions/graphql/queries';

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
