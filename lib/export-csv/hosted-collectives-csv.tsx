import React from 'react';
import { FormattedMessage } from 'react-intl';

export const AVERAGE_ROWS_PER_MINUTE = 8240;

type Fields =
  | 'name'
  | 'slug'
  | 'type'
  | 'legalName'
  | 'description'
  | 'website'
  | 'tags'
  | 'currency'
  | 'approvedAt'
  | 'balance'
  | 'hostFeePercent'
  | 'adminEmails'
  | 'adminCount'
  | 'firstContributionDate'
  | 'lastContributionDate'
  | 'firstExpenseDate'
  | 'lastExpenseDate'
  | 'status'
  | 'dateApplied'
  | 'unhostedAt'
  | 'unfrozenAt'
  | 'numberOfExpensesYear'
  | 'valueOfExpensesYear'
  | 'maxExpenseValueYear'
  | 'numberOfPayeesYear'
  | 'numberOfContributionsYear'
  | 'valueOfContributionsYear'
  | 'valueOfRefundedContributionsYear'
  | 'valueOfHostFeeYear'
  | 'spentTotalYear'
  | 'receivedTotalYear'
  | 'numberOfExpensesAllTime'
  | 'valueOfExpensesAllTime'
  | 'maxExpenseValueAllTime'
  | 'numberOfPayeesAllTime'
  | 'numberOfContributionsAllTime'
  | 'valueOfContributionsAllTime'
  | 'valueOfRefundedContributionsAllTime'
  | 'valueOfHostFeeAllTime'
  | 'spentTotalAllTime'
  | 'receivedTotalAllTime'
  | 'expenseMonthlyAverageCount'
  | 'expenseMonthlyAverageTotal'
  | 'contributionMonthlyAverageCount'
  | 'contributionMonthlyAverageTotal'
  | 'spentTotalMonthlyAverage'
  | 'receivedTotalMonthlyAverage'
  | 'spentTotalYearlyAverage'
  | 'receivedTotalYearlyAverage';

const MonthlyAverageTooltip = (
  <FormattedMessage
    defaultMessage="The average is calculated over the number of months since the collective was approved on your host"
    id="MonthlyAverage.Tooltip"
  />
);

const YearlyAverageTooltip = (
  <FormattedMessage
    defaultMessage="The average is calculated over the number of years since the collective was approved on your host"
    id="YearlyAverage.Tooltip"
  />
);

export enum FIELD_OPTIONS {
  DEFAULT = 'DEFAULT',
  NEW_PRESET = 'NEW_PRESET',
}

export const FieldOptionsLabels = {
  [FIELD_OPTIONS.DEFAULT]: <FormattedMessage defaultMessage="Platform Default" id="5kf2KT" />,
  [FIELD_OPTIONS.NEW_PRESET]: (
    <span className="text-primary">
      <FormattedMessage defaultMessage="New Preset" id="99ZtbG" />
    </span>
  ),
};

export const GROUPS = {
  about: <FormattedMessage defaultMessage="About" id="collective.about.title" />,
  financials: <FormattedMessage defaultMessage="Financials" id="smkYlB" />,
  contributions: <FormattedMessage defaultMessage="Contributions" id="Contributions" />,
  expenses: <FormattedMessage defaultMessage="Expenses" id="Expenses" />,
};

export const FIELDS: Array<{
  id: Fields;
  group: keyof typeof GROUPS;
  tooltip?: React.ReactNode;
  label: React.ReactNode;
}> = [
  {
    id: 'name',
    group: 'about',
    label: <FormattedMessage id="Fields.name" defaultMessage="Name" />,
  },
  {
    id: 'slug',
    group: 'about',
    label: <FormattedMessage id="Fields.slug" defaultMessage="Slug" />,
  },
  {
    id: 'description',
    group: 'about',
    label: <FormattedMessage id="Fields.description" defaultMessage="Description" />,
  },
  {
    id: 'type',
    group: 'about',
    label: <FormattedMessage id="Fields.type" defaultMessage="Type" />,
  },
  {
    id: 'status',
    group: 'about',
    label: <FormattedMessage id="Status" defaultMessage="Status" />,
  },
  {
    id: 'legalName',
    group: 'about',
    label: <FormattedMessage id="LegalName" defaultMessage="Legal Name" />,
  },
  {
    id: 'website',
    group: 'about',
    label: <FormattedMessage id="Fields.website" defaultMessage="Website" />,
  },
  {
    id: 'currency',
    group: 'about',
    label: <FormattedMessage id="Currency" defaultMessage="Currency" />,
  },
  {
    id: 'tags',
    group: 'about',
    label: <FormattedMessage id="Tags" defaultMessage="Tags" />,
  },
  {
    id: 'approvedAt',
    group: 'about',
    label: <FormattedMessage id="Fields.approvedAt" defaultMessage="Approved At" />,
  },
  {
    id: 'adminCount',
    group: 'about',
    label: <FormattedMessage id="Fields.adminCount" defaultMessage="Number of Admin" />,
  },
  {
    id: 'adminEmails',
    group: 'about',
    label: <FormattedMessage id="Fields.adminEmails" defaultMessage="Admin Emails" />,
  },
  {
    id: 'balance',
    group: 'financials',
    label: <FormattedMessage id="Balance" defaultMessage="Balance" />,
  },
  {
    id: 'hostFeePercent',
    group: 'financials',
    label: <FormattedMessage id="Fields.hostFeePercent" defaultMessage="Host Fee Percent" />,
  },
  {
    id: 'firstContributionDate',
    group: 'contributions',
    label: <FormattedMessage id="Fields.firstContributionDate" defaultMessage="First Contribution Date" />,
  },
  {
    id: 'lastContributionDate',
    group: 'contributions',
    label: <FormattedMessage id="Fields.lastContributionDate" defaultMessage="Last Contribution Date" />,
  },
  {
    id: 'firstExpenseDate',
    group: 'expenses',
    label: <FormattedMessage id="Fields.firstExpenseDate" defaultMessage="First Expense Date" />,
  },
  {
    id: 'lastExpenseDate',
    group: 'expenses',
    label: <FormattedMessage id="Fields.lastExpenseDate" defaultMessage="Last Expense Date" />,
  },
  { id: 'dateApplied', group: 'about', label: <FormattedMessage defaultMessage="Date Applied" id="dateApplied" /> },
  { id: 'unhostedAt', group: 'about', label: <FormattedMessage defaultMessage="Unhosted At" id="unhostedAt" /> },
  { id: 'unfrozenAt', group: 'about', label: <FormattedMessage defaultMessage="Unfrozen At" id="unfrozenAt" /> },
  {
    id: 'numberOfExpensesYear',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Number of Expenses (1 year)" id="numberOfExpensesYear" />,
  },
  {
    id: 'valueOfExpensesYear',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Total Value of Expenses (1 year)" id="valueOfExpensesYear" />,
  },
  {
    id: 'maxExpenseValueYear',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Max Expense Value (1 year)" id="maxExpenseValueYear" />,
  },
  {
    id: 'numberOfPayeesYear',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Distinct number of Payees (1 year)" id="numberOfPayeesYear" />,
  },
  {
    id: 'numberOfContributionsYear',
    group: 'contributions',
    label: <FormattedMessage defaultMessage="Number of Contributions (1 year)" id="numberOfContributionsYear" />,
  },
  {
    id: 'valueOfContributionsYear',
    group: 'contributions',
    label: <FormattedMessage defaultMessage="Total Value of Contributions (1 year)" id="valueOfContributionsYear" />,
  },
  {
    id: 'valueOfRefundedContributionsYear',
    group: 'contributions',
    label: <FormattedMessage defaultMessage="Total Refunded Value (1 year)" id="valueOfRefundedContributionsYear" />,
  },
  {
    id: 'valueOfHostFeeYear',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Host Fee Paid (1 year)" id="valueOfHostFeeYear" />,
  },
  {
    id: 'numberOfExpensesAllTime',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Number of Expenses (All Time)" id="numberOfExpensesAllTime" />,
  },
  {
    id: 'valueOfExpensesAllTime',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Total Value of Expenses (All Time)" id="valueOfExpensesAllTime" />,
  },
  {
    id: 'maxExpenseValueAllTime',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Max Expense Value (All Time)" id="maxExpenseValueAllTime" />,
  },
  {
    id: 'numberOfPayeesAllTime',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Distinct Payees (All Time)" id="numberOfPayeesAllTime" />,
  },
  {
    id: 'numberOfContributionsAllTime',
    group: 'contributions',
    label: <FormattedMessage defaultMessage="Number of Contributions (All Time)" id="numberOfContributionsAllTime" />,
  },
  {
    id: 'valueOfContributionsAllTime',
    group: 'contributions',
    label: (
      <FormattedMessage defaultMessage="Total Value of Contributions (All Time)" id="valueOfContributionsAllTime" />
    ),
  },
  {
    id: 'valueOfRefundedContributionsAllTime',
    group: 'contributions',
    label: (
      <FormattedMessage defaultMessage="Total Refunded Value (All Time)" id="valueOfRefundedContributionsAllTime" />
    ),
  },
  {
    id: 'valueOfHostFeeAllTime',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Host Fee Paid (All Time)" id="valueOfHostFeeAllTime" />,
  },
  {
    id: 'spentTotalYear',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Total Spent (1 year)" id="spentTotalYear" />,
    tooltip: (
      <FormattedMessage
        defaultMessage="Amount spent in Contributions and Expenses, excluding fees"
        id="spentTotal.tooltip"
      />
    ),
  },
  {
    id: 'receivedTotalYear',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Total Received (1 year)" id="receivedTotalYear" />,
    tooltip: (
      <FormattedMessage defaultMessage="Amount received in Contributions and Expenses" id="receivedTotal.tooltip" />
    ),
  },
  {
    id: 'spentTotalAllTime',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Total Spent (All Time)" id="spentTotalAllTime" />,
    tooltip: (
      <FormattedMessage
        defaultMessage="Amount spent in Contributions and Expenses, excluding fees"
        id="spentTotal.tooltip"
      />
    ),
  },
  {
    id: 'receivedTotalAllTime',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Total Received (All Time)" id="receivedTotalAllTime" />,
    tooltip: (
      <FormattedMessage defaultMessage="Amount received in Contributions and Expenses" id="receivedTotal.tooltip" />
    ),
  },
  {
    id: 'expenseMonthlyAverageCount',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Monthly Avg. Number of Expenses" id="expenseMonthlyAverageCount" />,
    tooltip: MonthlyAverageTooltip,
  },
  {
    id: 'expenseMonthlyAverageTotal',
    group: 'expenses',
    label: <FormattedMessage defaultMessage="Monthly Avg. Value of Expenses" id="expenseMonthlyAverageTotal" />,
    tooltip: MonthlyAverageTooltip,
  },
  {
    id: 'contributionMonthlyAverageCount',
    group: 'contributions',
    label: (
      <FormattedMessage defaultMessage="Monthly Avg. Number of Contributions" id="contributionMonthlyAverageCount" />
    ),
    tooltip: MonthlyAverageTooltip,
  },
  {
    id: 'contributionMonthlyAverageTotal',
    group: 'contributions',
    label: (
      <FormattedMessage defaultMessage="Monthly Avg. Value of Contributions" id="contributionMonthlyAverageTotal" />
    ),
    tooltip: MonthlyAverageTooltip,
  },
  {
    id: 'receivedTotalMonthlyAverage',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Avg. Monthly Received" id="receivedTotalMonthlyAverage" />,
    tooltip: MonthlyAverageTooltip,
  },
  {
    id: 'spentTotalMonthlyAverage',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Avg. Monthly Spent" id="spentTotalMonthlyAverage" />,
    tooltip: MonthlyAverageTooltip,
  },
  {
    id: 'receivedTotalYearlyAverage',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Avg. Yearly Received" id="receivedTotalYearlyAverage" />,
    tooltip: YearlyAverageTooltip,
  },
  {
    id: 'spentTotalYearlyAverage',
    group: 'financials',
    label: <FormattedMessage defaultMessage="Avg. Yearly Spent" id="spentTotalYearlyAverage" />,
    tooltip: YearlyAverageTooltip,
  },
];

export const GROUP_FIELDS = Object.keys(GROUPS).reduce((dict, groupId) => {
  return { ...dict, [groupId]: FIELDS.filter(f => f.group === groupId).map(f => f.id) };
}, {});

const DEFAULT_FIELDS: Array<Fields> = [
  'name',
  'slug',
  'type',
  'currency',
  'approvedAt',
  'website',
  'balance',
  'hostFeePercent',
  'adminCount',
  'adminEmails',
  'lastContributionDate',
  'numberOfContributionsAllTime',
];

export const PLATFORM_PRESETS = {
  DEFAULT: { fields: DEFAULT_FIELDS, flattenTaxesAndPaymentProcessorFees: false },
};
