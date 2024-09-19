import { useCallback } from 'react';

import useLocalStorage from '../../lib/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '../../lib/local-storage';

import { useWorkspace } from '../WorkspaceProvider';

// TODO: use more precise types
type PageVisit = {
  type: 'account' | 'expense' | 'transaction' | 'page';
  key: string;
  data: any;
};

type RecentlyVisited = {
  [slug: string]: PageVisit[];
};

export function useRecentlyVisited() {
  const [recentlyVisited, setRecentlyVisited] = useLocalStorage<RecentlyVisited>(
    LOCAL_STORAGE_KEYS.RECENTLY_VISITED,
    {},
  );
  const { workspace } = useWorkspace();

  const dashboardSlug = workspace.slug;

  const addToRecent = useCallback(
    (pageVisit: PageVisit) => {
      setRecentlyVisited(prevRecentlyVisited => {
        const dashboardVisits = prevRecentlyVisited[dashboardSlug] || [];
        const updatedDashboardVisits = [pageVisit, ...dashboardVisits.filter(result => result.key !== pageVisit.key)];

        return {
          ...prevRecentlyVisited,
          [dashboardSlug]: updatedDashboardVisits.slice(0, 5), // Keep only the last five results for the given dashboard
        };
      });
    },
    [dashboardSlug, setRecentlyVisited],
  );

  const currentRecentlyVisited = recentlyVisited[dashboardSlug] || [];

  return { recentlyVisited: currentRecentlyVisited, addToRecent };
}
