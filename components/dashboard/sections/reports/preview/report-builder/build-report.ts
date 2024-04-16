import { pick } from 'lodash';

import { ReportSection } from '../types';

import { computationalGroups } from './computational-groups';
import { predefinedGroups } from './predefined-groups';

export const buildReport = (
  transactionsReportResultGroups,
  { showCreditDebit, filter = {}, useComputationalLayout },
) => {
  if (!transactionsReportResultGroups) {
    return null;
  }
  let remainingNodes = transactionsReportResultGroups;
  let reportRows = [];
  const reportGroups = useComputationalLayout ? computationalGroups : predefinedGroups;

  reportRows = reportGroups.map(reportGroup => {
    const rowFilter = { ...reportGroup.filter, ...filter };

    const matchingResultNodes = remainingNodes.filter(node => {
      return Object.keys(rowFilter).every(key => {
        return node[key] === rowFilter[key];
      });
    });

    remainingNodes = remainingNodes.filter(node => !matchingResultNodes.includes(node));

    const amounts = matchingResultNodes.reduce(
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
      ...reportGroup,
      ...amounts,
      filter: rowFilter,
      groups: matchingResultNodes,
    };
  });

  // Add the remaining result groups not matched by the defined groups
  const remainderRows = remainingNodes.map(group => ({
    section: ReportSection.OTHER,
    amount: group.amount.valueInCents,
    netAmount: group.netAmount.valueInCents,
    platformFee: group.platformFee.valueInCents,
    paymentProcessorFee: group.paymentProcessorFee.valueInCents,
    hostFee: group.hostFee.valueInCents,
    taxAmount: group.taxAmount.valueInCents,
    filter: pick(group, 'kind', 'type', 'expenseType', 'isRefund', 'isHost'),
    groups: [group],
  }));

  // Filter out groups with 0 amount, unless showCreditDebit is enabled
  const rows = [...reportRows, ...remainderRows].filter(part =>
    showCreditDebit ? part.groups?.length : part.amount !== 0,
  );

  // Group by section
  const rowsBySection = rows.reduce((acc, row) => {
    const key = row.section;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {});

  return Object.keys(rowsBySection).map(section => {
    return {
      label: section,
      rows: rowsBySection[section],
      total: rowsBySection[section].reduce((total, section) => total + section.netAmount, 0),
    };
  });
};
