import React from 'react';
import { FormattedMessage } from 'react-intl';

export const AVERAGE_ROWS_PER_MINUTE = 8240;

export type CSVField =
  | 'name'
  | 'slug'
  | 'type'
  | 'legalName'
  | 'description'
  | 'website'
  | 'currency'
  | 'approvedAt'
  | 'balance'
  | 'hostFeePercent'
  | 'adminEmails'
  | 'adminCount'
  | 'firstContributionDate'
  | 'lastContributionDate'
  | 'totalAmountOfContributions'
  | 'totalNumberOfContributions'
  | 'firstExpenseDate'
  | 'lastExpenseDate'
  | 'numberOfExpenses';

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
  id: CSVField;
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
    id: 'totalAmountOfContributions',
    group: 'contributions',
    label: <FormattedMessage id="Fields.totalAmountOfContributions" defaultMessage="Total Amount of Contributions" />,
  },
  {
    id: 'totalNumberOfContributions',
    group: 'contributions',
    label: <FormattedMessage id="Fields.totalNumberOfContributions" defaultMessage="Total Number of Contributions" />,
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
  {
    id: 'numberOfExpenses',
    group: 'expenses',
    label: <FormattedMessage id="Fields.numberOfExpenses" defaultMessage="Number of Expenses" />,
  },
];

export const GROUP_FIELDS = Object.keys(GROUPS).reduce((dict, groupId) => {
  return { ...dict, [groupId]: FIELDS.filter(f => f.group === groupId).map(f => f.id) };
}, {});

const DEFAULT_FIELDS: Array<CSVField> = [
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
  'totalNumberOfContributions',
];

export const PLATFORM_PRESETS = {
  DEFAULT: { fields: DEFAULT_FIELDS, flattenTaxesAndPaymentProcessorFees: false },
};
