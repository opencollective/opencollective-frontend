import React from 'react';

import type { DashboardSectionProps } from '../../../types';

import { HostContributionsReportList } from './HostContributionsReportList';
import { HostContributionsReportView } from './HostContributionsReportView';

export function HostContributionsReports(props: DashboardSectionProps) {
  if (props.subpath[0]) {
    return <HostContributionsReportView {...props} />;
  }

  return <HostContributionsReportList {...props} />;
}
