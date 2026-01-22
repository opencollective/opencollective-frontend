import React from 'react';

import type { DashboardQuery } from '@/lib/graphql/types/v2/graphql';

import { ALL_SECTIONS } from './constants';

// Account interface query types include Bot, which we almost never want to use, but if included makes accessing fields for proper types difficult, this convenience type excludes it
type ExcludeAccountType<T, S> = T extends infer U
  ? U extends { __typename?: S }
    ? never
    : U extends { childrenAccounts: unknown }
      ? Omit<U, 'childrenAccounts'> & {
          childrenAccounts: Omit<U['childrenAccounts'], 'nodes'> & { nodes: ExcludeAccountType<U, S>[] };
        }
      : U
  : never;

type OrgTypeFields = { hasHosting?: boolean; canStartResumeContributionsProcess?: boolean };

type ParentTypeFields = DashboardQuery['account'] extends infer U
  ? U extends { parent?: unknown }
    ? Omit<U, 'parent'> & { parent: ExcludeAccountType<U['parent'], 'Bot' | 'Event' | 'Project' | 'Individual'> }
    : never
  : never;

export type DashboardContextType = {
  selectedSection: string;
  subpath: string[];
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  account:
    | (ExcludeAccountType<DashboardQuery['account'], 'Bot'> & OrgTypeFields & { parent?: ParentTypeFields })
    | null;
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
