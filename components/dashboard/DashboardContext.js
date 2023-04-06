import React from 'react';

import { ALL_SECTIONS } from './constants';

export const DashboardContext = React.createContext({
  selectedSection: ALL_SECTIONS.MANAGE_CONTRIBUTIONS,
  expandedSection: null,
  setExpandedSection: () => {},
  account: null,
});
