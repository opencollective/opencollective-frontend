import React from 'react';

import type { DashboardSectionProps } from '../../types';

import { CSVTransactionsImport } from './CSVTransactionsImport';
import { CSVTransactionsImportsTable } from './CSVTransactionsImportsTable';

export const CSVTransactionsImports = ({ accountSlug, subpath }: DashboardSectionProps) => {
  const importId = subpath[0];
  if (importId) {
    return <CSVTransactionsImport accountSlug={accountSlug} importId={importId} />;
  } else {
    return <CSVTransactionsImportsTable accountSlug={accountSlug} />;
  }
};
