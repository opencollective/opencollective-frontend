import React from 'react';

import { CSVTransactionsImport } from './CSVTransactionsImport';
import { CSVTransactionsImportsTable } from './CSVTransactionsImportsTable';

export const CSVTransactionsImports = ({ accountSlug, subpath }) => {
  const importId = subpath[0];
  if (importId) {
    return <CSVTransactionsImport accountSlug={accountSlug} importId={importId} />;
  } else {
    return <CSVTransactionsImportsTable accountSlug={accountSlug} />;
  }
};
