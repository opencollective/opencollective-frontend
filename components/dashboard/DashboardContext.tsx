import React from 'react';

import type { WorkspaceAccount } from '@/lib/LoggedInUser';

import { ALL_SECTIONS } from './constants';

export type DashboardContextType = {
  selectedSection: string;
  subpath: string[];
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  /** Full account data from adminPanelQuery. May be null while the query is loading. */
  account: WorkspaceAccount | null;
  /** Workspace data from LoggedInUser.getWorkspace(). Available immediately after login, before adminPanelQuery completes. */
  workspace: WorkspaceAccount | null;
  activeSlug: string | null;
  defaultSlug: string | null;
  setDefaultSlug: (slug: string | null) => void;
  getProfileUrl: (account: { id: string; slug: string; type: string }) => string | null;
  isRootDashboard: boolean;
};

export const DashboardContext = React.createContext<DashboardContextType>({
  subpath: [],
  selectedSection: ALL_SECTIONS.EXPENSES,
  expandedSection: null,
  setExpandedSection: () => {},
  account: null,
  workspace: null,
  activeSlug: null,
  defaultSlug: null,
  setDefaultSlug: () => {},
  getProfileUrl: () => null,
  isRootDashboard: false,
});
