import React from 'react';

import { ALL_SECTIONS } from './constants';
import { DashboardSettings } from './SidebarSettingsPanel';

type DashboardContextType = {
  selectedSection: string;
  subpath: string[];
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  account: any;
  activeSlug: string | null;
  defaultSlug: string | null;
  setDefaultSlug: (slug: string | null) => void;
  getProfileUrl: (account: { id: string; slug: string; type: string }) => string | null;
  prototype?: DashboardSettings;
  recentSections: string[];
  addRecentSection: (section: string) => void;
  pinnedSections: string[];
  pinSection: (section: string) => void;
  unpinSection: (section: string) => void;
  togglePinnedSection: (section: string) => void;
  isSectionPinned: (section: string) => boolean;
  activeSectionHighlight: { section: string; source: 'menu' | 'shortcut' | 'tools' } | null;
  setActiveSectionHighlight: (highlight: { section: string; source: 'menu' | 'shortcut' | 'tools' } | null) => void;
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
  prototype: undefined,
  recentSections: [],
  addRecentSection: () => {},
  pinnedSections: [],
  pinSection: () => {},
  unpinSection: () => {},
  togglePinnedSection: () => {},
  isSectionPinned: () => false,
  activeSectionHighlight: null,
  setActiveSectionHighlight: () => {},
});
