import { isNil, pick } from 'lodash';

import dayjs from '../../../../../lib/dayjs';

import { Group, GroupFilter, ReportSection } from './types';

export const filterToTransactionsQuery = (hostSlug, groupFilter: GroupFilter, queryFilterValues) => {
  return {
    ...(groupFilter.isHost
      ? {
          account: hostSlug,
        }
      : {
          excludeHost: true,
        }),
    ...(groupFilter.kind && {
      kind: groupFilter.kind,
    }),
    ...(groupFilter.type && {
      type: groupFilter.type,
    }),
    ...(groupFilter.expenseType && {
      expenseType: groupFilter.expenseType,
    }),
    ...(!isNil(groupFilter.isRefund) && {
      isRefund: groupFilter.isRefund,
    }),
    'date[gte]': dayjs.utc(queryFilterValues.period.gt).format('YYYY-MM-DD'),
    'date[lte]': dayjs.utc(queryFilterValues.period.lt).format('YYYY-MM-DD'),
    'date[tz]': 'UTC',
  };
};

// TODO: Internationalization before making preview feature public
const reports: Group[] = [
  {
    label: 'Managed funds',
    filter: { isHost: false },
    helpLabel: `Funds going to and from Hosted Collective accounts`,
  },
  { label: 'Operational funds', filter: { isHost: true }, helpLabel: `Funds going to the Fiscal Host account` },
];

const groups: Group[] = [
  {
    section: ReportSection.CONTRIBUTIONS,
    label: 'Contributions',
    filter: { kind: 'CONTRIBUTION', type: 'CREDIT', isRefund: false },
  },
  {
    section: ReportSection.CONTRIBUTIONS,
    label: 'Refunded contributions',
    filter: { kind: 'CONTRIBUTION', type: 'DEBIT', isRefund: true },
  },
  {
    section: ReportSection.CONTRIBUTIONS,
    label: 'Added funds',
    filter: { kind: 'ADDED_FUNDS', type: 'CREDIT', isRefund: false },
  },
  {
    section: ReportSection.CONTRIBUTIONS,
    label: 'Refunded Added funds',
    filter: { kind: 'ADDED_FUNDS', type: 'CREDIT', isRefund: true },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid Grants',
    filter: { kind: 'EXPENSE', expenseType: 'GRANT', type: 'DEBIT', isRefund: false },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid Invoices',
    filter: { kind: 'EXPENSE', expenseType: 'INVOICE', type: 'DEBIT', isRefund: false },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid Reimbursements',
    filter: { kind: 'EXPENSE', expenseType: 'RECEIPT', type: 'DEBIT', isRefund: false },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid Virtual Card Charges',
    filter: { kind: 'EXPENSE', expenseType: 'CHARGE', type: 'DEBIT', isRefund: false },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid unclassified expenses',
    filter: { kind: 'EXPENSE', expenseType: 'UNCLASSIFIED', type: 'DEBIT', isRefund: false },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Expenses marked as unpaid',
    filter: { kind: 'EXPENSE', type: 'CREDIT', isRefund: true },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Payment processor fees',
    filter: { kind: 'PAYMENT_PROCESSOR_FEE' },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Host Fees Paid',
    filter: { kind: 'HOST_FEE', isRefund: false, type: 'DEBIT' },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Collected Host Fees',
    filter: { kind: 'HOST_FEE', isRefund: false, type: 'CREDIT' },
  },
  { section: ReportSection.FEES_TIPS, label: 'Refunded Host Fees', filter: { kind: 'HOST_FEE', isRefund: true } },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Paid Platform Settlements',
    filter: { kind: 'EXPENSE', type: 'DEBIT', expenseType: 'SETTLEMENT' },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Platform Fees Paid',
    filter: { kind: 'HOST_FEE_SHARE' },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Platform Fees Debt',
    filter: { kind: 'HOST_FEE_SHARE_DEBT' },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Platform Tips Debt',
    filter: { kind: 'PLATFORM_TIP_DEBT' },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Lost disputed payment processor fees',
    filter: { kind: 'PAYMENT_PROCESSOR_DISPUTE_FEE' },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Covered Payment processor fees',
    filter: { kind: 'PAYMENT_PROCESSOR_COVER' },
  },
  {
    section: ReportSection.OTHER,
    label: 'Balance transfer',
    filter: { kind: 'BALANCE_TRANSFER' },
  },
  {
    section: ReportSection.OTHER,
    label: 'Outgoing Added Funds',
    filter: { kind: 'ADDED_FUNDS', type: 'DEBIT' },
  },
  {
    section: ReportSection.OTHER,
    label: 'Outgoing Contributions',
    filter: { kind: 'CONTRIBUTION', type: 'DEBIT', isRefund: false },
  },
  {
    section: ReportSection.OTHER,
    label: 'Refunded outgoing contributions',
    filter: { kind: 'CONTRIBUTION', type: 'CREDIT', isRefund: true },
  },
  {
    section: ReportSection.OTHER,
    label: 'Collected Expenses',
    filter: { kind: 'EXPENSE', type: 'CREDIT', isRefund: false },
  },
  {
    section: ReportSection.OTHER,
    label: 'Prepaid payment method',
    filter: { kind: 'PREPAID_PAYMENT_METHOD' },
  },
];

export const buildReportGroups = (data, { showCreditDebit }) => {
  const firstLevel = reports;

  const sumTransactions = data?.host?.transactionsReport || [];

  return firstLevel.map(firstLevelItem => {
    const levelFilter = firstLevelItem.filter;

    let remainingGroups = sumTransactions.filter(group => {
      return Object.keys(levelFilter).every(key => {
        return group[key] === levelFilter[key];
      });
    });
    const resultingGroups = groups.map(group => {
      const groupFilter = { ...group.filter, ...firstLevelItem.filter };
      const transactionGroups = remainingGroups.filter(group => {
        return Object.keys(groupFilter).every(key => {
          return group[key] === groupFilter[key];
        });
      });

      remainingGroups = remainingGroups.filter(group => !transactionGroups.includes(group));
      return {
        ...group,
        amount: transactionGroups.reduce((total, t) => total + t.amount.valueInCents, 0),
        filter: groupFilter,
        groups: transactionGroups,
      };
    });

    const remainderGroups = remainingGroups.map(group => ({
      label: JSON.stringify(pick(group, 'kind', 'type', 'expenseType', 'isRefund')),
      section: ReportSection.OTHER,
      amount: group.amount.valueInCents,
      filter: pick(group, 'kind', 'type', 'expenseType', 'isRefund', 'isHost'),
      groups: [group],
    }));

    const parts = [...resultingGroups, ...remainderGroups].filter(part =>
      showCreditDebit ? part.groups?.length : part.amount !== 0,
    );

    // group by section
    const groupsBySection = parts.reduce((acc, group) => {
      const key = group.section;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(group);
      return acc;
    }, {});

    const sections = Object.keys(groupsBySection).map(section => {
      return {
        label: section,
        parts: groupsBySection[section],
        total: groupsBySection[section].reduce((total, section) => total + section.amount, 0),
      };
    });

    return {
      ...firstLevelItem,
      parts: sections,
      total: parts.reduce((total, part) => total + part.amount, 0),
    };
  });
};

function filtersOverlap(filterI: GroupFilter, filterJ: GroupFilter): boolean {
  for (const key of Object.keys(filterI) as (keyof GroupFilter)[]) {
    if (filterI[key] !== filterJ[key] && filterJ[key] !== undefined) {
      return false; // They do not overlap if any corresponding defined key doesn't match
    }
  }
  for (const key of Object.keys(filterJ) as (keyof GroupFilter)[]) {
    if (filterI[key] !== filterJ[key] && filterI[key] !== undefined) {
      return false; // They do not overlap if any corresponding defined key doesn't match
    }
  }
  return true; // All compared keys match
}

function checkGroupsMutualExclusivity(groups: Group[]): boolean {
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const filterI = groups[i].filter;
      const filterJ = groups[j].filter;

      if (filtersOverlap(filterI, filterJ)) {
        throw new Error(
          `Report groups are not mutually exclusive, overlapping filters: ${JSON.stringify({ 1: filterI, 2: filterJ })}`,
        );
      }
    }
  }
  return true;
}

// Check that the pre-defined report groups are mutually exclusive, otherwise throw an error
checkGroupsMutualExclusivity(groups);
