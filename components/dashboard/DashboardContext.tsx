import React from 'react';

import type { DashboardQuery } from '@/lib/graphql/types/v2/graphql';

import { ALL_SECTIONS } from './constants';

export type DashboardContextType = {
  selectedSection: string;
  subpath: string[];
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  account: DashboardQuery['account'] | null;
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
  activeSlug: null,
  defaultSlug: null,
  setDefaultSlug: () => {},
  getProfileUrl: () => null,
});
