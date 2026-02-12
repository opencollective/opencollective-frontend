import React from 'react';

import type { WorkspaceAccount } from '@/lib/LoggedInUser';

import { ALL_SECTIONS } from './constants';

export type DashboardContextType = {
  selectedSection: string;
  subpath: string[];
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  /** Full account data from adminPanelQuery. May be null while the query is loading. */
  account: any;
  /** Whether the adminPanelQuery is still loading */
  accountLoading: boolean;
  /** Workspace data from LoggedInUser.getWorkspace(). Available immediately after login, before adminPanelQuery completes. */
  workspace: WorkspaceAccount | null;
  activeSlug: string | null;
  defaultSlug: string | null;
  setDefaultSlug: (slug: string | null) => void;
  getProfileUrl: (account: { id: string; slug: string; type: string }) => string | null;
};

export const DashboardContext = React.createContext<DashboardContextType>({
  subpath: [],
  selectedSection: ALL_SECTIONS.EXPENSES,
  expandedSection: null,
  setExpandedSection: () => {},
  account: null,
  accountLoading: false,
  workspace: null,
  activeSlug: null,
  defaultSlug: null,
  setDefaultSlug: () => {},
  getProfileUrl: () => null,
});
