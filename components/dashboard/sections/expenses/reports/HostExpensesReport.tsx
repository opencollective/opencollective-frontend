import React from 'react';

import type { DashboardSectionProps } from '../../../types';

import { HostExpensesReportList } from './HostExpensesReportList';
import { HostExpensesReportView } from './HostExpensesReportView';

export function HostExpensesReport(props: DashboardSectionProps) {
  if (props.subpath[0]) {
    return <HostExpensesReportView {...props} />;
  }

  return <HostExpensesReportList {...props} />;
}
