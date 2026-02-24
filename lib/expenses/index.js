import { get, isNull, merge, omit, omitBy } from 'lodash';
import memoizeOne from 'memoize-one';

import { CollectiveType } from '../constants/collectives';
import { ExpenseStatus } from '../graphql/types/v2/graphql';

const { ORGANIZATION } = CollectiveType;

export const getPayoutProfiles = memoizeOne(loggedInAccount => {
  if (!loggedInAccount) {
    return [];
  } else {
    const payoutProfiles = [loggedInAccount];
    for (const membership of get(loggedInAccount, 'adminMemberships.nodes', [])) {
      if (
        // Organizations
        [ORGANIZATION].includes(membership.account.type) ||
        // Relax available accounts
        membership.account.isActive
      ) {
        // Push main account
        payoutProfiles.push(omit(membership.account, ['childrenAccounts']));
        // Push children and add Host if missing
        for (const childrenAccount of membership.account.childrenAccounts.nodes) {
          if (childrenAccount.isActive) {
            payoutProfiles.push({ host: membership.account.host, ...childrenAccount });
          }
        }
      }
    }
    return payoutProfiles;
  }
});

export const DEFAULT_SUPPORTED_EXPENSE_TYPES = { GRANT: false, INVOICE: true, RECEIPT: true };

/**
 * Helper to format and combine expense items (with URLs) and attached files into a unified format
 */
export const getFilesFromExpense = (expense, intl) => {
  if (!expense) {
    return [];
  }

  const items = expense.items?.filter(({ url }) => Boolean(url)) || [];
  let files = [...items, ...(expense.attachedFiles || [])];

  if (expense.invoiceFile) {
    files.unshift({
      id: expense.invoiceFile.id,
      name: expense.invoiceFile.name,
      url: expense.invoiceFile.url,
      info: { ...expense.invoiceFile },
    });
  }

  if (expense.status === ExpenseStatus.DRAFT) {
    files = [...files, ...(expense.draft?.items ?? []).filter(({ url }) => Boolean(url))];
    files = [...files, ...(expense.draft?.attachedFiles ?? []).filter(({ url }) => Boolean(url))];

    if (expense.draft?.invoiceFile?.url) {
      files.unshift({
        id: expense.draft.invoiceFile.id,
        name: expense.draft.invoiceFile.name,
        url: expense.draft.invoiceFile.url,
        info: { ...expense.draft.invoiceFile },
      });
    }
  }

  /* Expense items can have a `file` FileInfo object
   Attached files can have `info` FileInfo object
   Make that available under `info` for all expense files */
  files = files.map(file => ({ ...file, info: file.info || file.file }));

  // Add a default name to files that don't have it
  files = files.map((file, idx) => ({
    ...file,
    name: file.description || file.name || file.info?.name || getDefaultFileName(intl, idx, files.length),
  }));

  return files;
};

export const getDefaultFileName = (intl, idx, totalNbFiles) => {
  if (totalNbFiles === 1) {
    return intl.formatMessage({ id: 'File.AttachedFile', defaultMessage: 'Attached file' });
  } else {
    return intl.formatMessage({ defaultMessage: 'Attached file {number}', id: 'A+AIST' }, { number: idx + 1 });
  }
};

export const standardizeExpenseItemIncurredAt = incurredAt => {
  if (!incurredAt) {
    return null;
  } else if (typeof incurredAt === 'string') {
    return incurredAt.match(/^\d{4}-\d{2}-\d{2}$/) ? `${incurredAt}T00:00:00Z` : incurredAt;
  } else if (incurredAt instanceof Date) {
    return incurredAt.toISOString();
  }
};
