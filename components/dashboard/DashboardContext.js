import React from 'react';

import { ALL_SECTIONS } from './constants';

export const DashboardContext = React.createContext({
  selectedSection: ALL_SECTIONS.EXPENSES,
  expandedSection: null,
  setExpandedSection: () => {},
  account: null,
});
