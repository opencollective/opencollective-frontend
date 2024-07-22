import React from 'react';

import { TransactionsImport } from './TransactionsImport';
import { TransactionsImportsTable } from './TransactionsImportsTable';

export const ImportTransactions = ({ accountSlug, subpath }) => {
  const importId = subpath[1];
  if (importId) {
    return <TransactionsImport accountSlug={accountSlug} importId={importId} />;
  } else {
    return <TransactionsImportsTable accountSlug={accountSlug} />;
  }
};
