import React from 'react';

import { ALL_SECTIONS } from './constants';

type DashboardContextType = {
  selectedSection: string;
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  account: any;
  activeSlug: string | null;
};

export const DashboardContext = React.createContext<DashboardContextType>({
  selectedSection: ALL_SECTIONS.EXPENSES,
  expandedSection: null,
  setExpandedSection: () => {},
  account: null,
  activeSlug: null,
});
