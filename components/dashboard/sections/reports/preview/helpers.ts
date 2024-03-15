import { isNil, pick } from 'lodash';

import dayjs from '../../../../../lib/dayjs';

import { Group, GroupFilter, ReportSection } from './types';
import { TimeUnit, TransactionKind } from '../../../../../lib/graphql/types/v2/graphql';
import { getDayjsIsoUnit } from '../../../../../lib/date-utils';

export const filterToTransactionsQuery = (hostSlug, groupFilter: GroupFilter, variables) => {
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
    'date[gte]': dayjs.utc(variables.dateFrom).format('YYYY-MM-DD'),
    'date[lte]': dayjs.utc(variables.dateTo).format('YYYY-MM-DD'),
    'date[tz]': 'UTC',
  };
};

export const isCurrentPeriod = variables => {
  // const variables = deserializeReportSlug(value);
  const now = dayjs.utc();
  const dateFrom = dayjs.utc(variables.dateFrom);
  const dayjsIsoUnit = getDayjsIsoUnit(variables.timeUnit as TimeUnit);
  return dateFrom.isSame(now.startOf(dayjsIsoUnit), dayjsIsoUnit);
};

// TODO: Internationalization before making preview feature public
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

const kinds = Object.values(TransactionKind);
const kindGroups = kinds.flatMap(kind => {
  return [
    {
      section: 'INCOMING',
      // label: kind,
      filter: { kind, type: 'CREDIT', isRefund: false },
    },
    {
      section: 'INCOMING',
      // label: `${kind} (Invoices)`,
      filter: { kind, type: 'CREDIT', isRefund: false, expenseType: 'INVOICE' },
    },
    {
      section: 'INCOMING',
      // label: `${kind} (Settlements)`,
      filter: { kind, type: 'CREDIT', isRefund: false, expenseType: 'SETTLEMENT' },
    },
    {
      section: 'INCOMING',
      // label: `${kind} (Virtual card charges)`,
      filter: { kind, type: 'CREDIT', isRefund: false, expenseType: 'CHARGE' },
    },
    {
      section: 'INCOMING',
      // label: `${kind} (Reimbursements)`,
      filter: { kind, type: 'CREDIT', isRefund: false, expenseType: 'RECEIPT' },
    },
    {
      section: 'INCOMING',
      // label: `${kind} (Unclassified)`,
      filter: { kind, type: 'CREDIT', isRefund: false, expenseType: 'UNCLASSIFIED' },
    },
    {
      section: 'INCOMING',
      // label: `Refunded ${kind}`,
      filter: { kind, type: 'CREDIT', isRefund: true },
    },
    {
      section: 'OUTGOING',
      // label: kind,
      filter: { kind, type: 'DEBIT', isRefund: false },
    },
    {
      section: 'OUTGOING',
      // label: `Refunded ${kind}`,
      filter: { kind, type: 'DEBIT', isRefund: true },
    },
  ];
});
export const buildReportGroups = (transactionsReportNodeGroups, { showCreditDebit, filter = {}, useSimpleLayout }) => {
  if (!transactionsReportNodeGroups) {
    return null;
  }
  let remainingGroups = transactionsReportNodeGroups;
  let resultingGroups = [];

  if (useSimpleLayout) {
    console.log('kindGroups', kindGroups);

    resultingGroups = kindGroups.map(kg => {
      const groupFilter = { ...kg.filter, ...filter };

      const transactionGroups = remainingGroups.filter(rg => {
        return Object.keys(groupFilter).every(key => {
          return rg[key] === groupFilter[key];
        });
      });

      remainingGroups = remainingGroups.filter(group => !transactionGroups.includes(group));

      const amounts = transactionGroups.reduce(
        (acc, g) => {
          const { amount, netAmount, platformFee, paymentProcessorFee, hostFee, taxAmount } = g;
          return {
            amount: acc.amount + amount.valueInCents,
            netAmount: acc.netAmount + netAmount.valueInCents,
            platformFee: acc.platformFee + platformFee.valueInCents,
            paymentProcessorFee: acc.paymentProcessorFee + paymentProcessorFee.valueInCents,
            hostFee: acc.hostFee + hostFee.valueInCents,
            taxAmount: acc.taxAmount + taxAmount.valueInCents,
          };
        },
        {
          amount: 0,
          netAmount: 0,
          platformFee: 0,
          paymentProcessorFee: 0,
          hostFee: 0,
          taxAmount: 0,
        },
      );
      return {
        ...kg,
        ...amounts,
        filter: groupFilter,
        groups: transactionGroups,
      };
    });
  } else {
    resultingGroups = groups.map(group => {
      const groupFilter = { ...group.filter, ...filter };
      const transactionGroups = remainingGroups.filter(group => {
        return Object.keys(groupFilter).every(key => {
          return group[key] === groupFilter[key];
        });
      });

      remainingGroups = remainingGroups.filter(group => !transactionGroups.includes(group));

      const amounts = transactionGroups.reduce(
        (acc, g) => {
          const { amount, netAmount, platformFee, paymentProcessorFee, hostFee, taxAmount } = g;
          return {
            amount: acc.amount + amount.valueInCents,
            netAmount: acc.netAmount + netAmount.valueInCents,
            platformFee: acc.platformFee + platformFee.valueInCents,
            paymentProcessorFee: acc.paymentProcessorFee + paymentProcessorFee.valueInCents,
            hostFee: acc.hostFee + hostFee.valueInCents,
            taxAmount: acc.taxAmount + taxAmount.valueInCents,
          };
        },
        {
          amount: 0,
          netAmount: 0,
          platformFee: 0,
          paymentProcessorFee: 0,
          hostFee: 0,
          taxAmount: 0,
        },
      );
      return {
        ...group,
        ...amounts,
        filter: groupFilter,
        groups: transactionGroups,
      };
    });
  }

  const remainderGroups = remainingGroups.map(group => ({
    label: JSON.stringify(pick(group, 'kind', 'type', 'expenseType', 'isRefund')),
    section: ReportSection.OTHER,
    amount: group.netAmount.valueInCents,
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
      total: groupsBySection[section].reduce((total, section) => total + section.netAmount, 0),
    };
  });

  return {
    parts: sections,
    total: parts.reduce((total, part) => total + part.netAmount, 0),
  };
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
