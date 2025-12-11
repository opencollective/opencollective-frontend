import { gql } from '@apollo/client';

import { expensesListFieldsFragment } from '@/components/expenses/graphql/fragments';

export const platformSubscriptionFeaturesFragment = gql`
  fragment PlatformSubscriptionFeatures on PlatformSubscriptionFeatures {
    TRANSFERWISE
    PAYPAL_PAYOUTS
    RECEIVE_HOST_APPLICATIONS
    CHART_OF_ACCOUNTS
    EXPENSE_SECURITY_CHECKS
    EXPECTED_FUNDS
    CHARGE_HOSTING_FEES
    AGREEMENTS
    TAX_FORMS
    OFF_PLATFORM_TRANSACTIONS
    FUNDS_GRANTS_MANAGEMENT
    VENDORS
    USE_EXPENSES
    UPDATES
    RECEIVE_FINANCIAL_CONTRIBUTIONS
    RECEIVE_EXPENSES
    ACCOUNT_MANAGEMENT
  }
`;

export const platformSubscriptionFragment = gql`
  fragment PlatformSubscriptionFields on PlatformSubscription {
    startDate
    endDate
    isCurrent
    plan {
      title
      type
      pricing {
        pricePerMonth {
          valueInCents
          currency
        }
        includedCollectives
        pricePerAdditionalCollective {
          valueInCents
          currency
        }
        includedExpensesPerMonth
        pricePerAdditionalExpense {
          valueInCents
          currency
        }
      }
      features {
        ...PlatformSubscriptionFeatures
      }
    }
  }

  ${platformSubscriptionFeaturesFragment}
`;

export const platformBillingFragment = gql`
  fragment PlatformBillingFields on PlatformBilling {
    billingPeriod {
      year
      month
      startDate
      endDate
      isCurrent
    }
    subscriptions {
      ...PlatformSubscriptionFields
    }
    utilization {
      activeCollectives
      expensesPaid
    }
    base {
      total {
        valueInCents
        currency
      }
      subscriptions {
        title
        amount {
          valueInCents
          currency
        }
        startDate
        endDate
      }
    }
    additional {
      utilization {
        activeCollectives
        expensesPaid
      }
      total {
        valueInCents
        currency
      }
      amounts {
        activeCollectives {
          valueInCents
          currency
        }
        expensesPaid {
          valueInCents
          currency
        }
      }
    }
    totalAmount {
      valueInCents
      currency
    }
    dueDate
    expenses {
      ...ExpensesListFields
    }
  }
  ${platformSubscriptionFragment}
  ${expensesListFieldsFragment}
`;
