import React from 'react';

import { ALL_SECTIONS } from './constants';

export type DashboardContextType = {
  selectedSection: string;
  subpath: string[];
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  account: any;
  activeSlug: string | null;
  defaultSlug: string | null;
  setDefaultSlug: (slug: string | null) => void;
  getProfileUrl: (account: { id: string; slug: string; type: string; publicId: string }) => string | null;
};

export const DashboardContext = React.createContext<DashboardContextType>({
  subpath: [],
  selectedSection: ALL_SECTIONS.EXPENSES,
  expandedSection: null,
  setExpandedSection: () => {},
  account: null,
  activeSlug: null,
  defaultSlug: null,
  setDefaultSlug: () => {},
  getProfileUrl: () => null,
});

type EntityWithHost = {
  host?: { id: string } | null;
};

/**
 * Checks whether the currently active dashboard *is* the fiscal host of `entity` (a transaction,
 * contribution/order, etc.) - i.e. whether we're inside that host's own dashboard right now.
 */
export function inHostDashboardOfEntity(
  entity: EntityWithHost | null | undefined,
  dashboardAccount: { id: string; isHost?: boolean } | null | undefined,
): boolean {
  return Boolean(dashboardAccount?.isHost && entity?.host?.id === dashboardAccount.id);
}
