import { useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/browser';
import { z } from 'zod';

import useLocalStorage from '../../lib/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '../../lib/local-storage';

import { useWorkspace } from '../WorkspaceProvider';

import { SearchEntity } from './filters';

const PageVisitSchema = z.object({
  entity: z.enum([
    SearchEntity.ACCOUNTS,
    SearchEntity.EXPENSES,
    SearchEntity.HOST_APPLICATIONS,
    SearchEntity.ORDERS,
    SearchEntity.TRANSACTIONS,
    SearchEntity.UPDATES,
  ]),
  id: z.string(),
});

const RecentlyVisitedSchema = z.record(z.string(), z.array(PageVisitSchema));

type RecentlyVisited = z.infer<typeof RecentlyVisitedSchema>;
export type PageVisit = z.infer<typeof PageVisitSchema>;

export function useRecentlyVisited() {
  const [recentlyVisitedRaw, setRecentlyVisitedRaw] = useLocalStorage<RecentlyVisited>(
    LOCAL_STORAGE_KEYS.RECENTLY_VISITED,
    {},
  );
  const { workspace } = useWorkspace();
  const dashboardSlug = workspace?.slug;

  // Parse the recently visited data using the zod schema
  const recentlyVisited: RecentlyVisited = useMemo(() => {
    try {
      return RecentlyVisitedSchema.parse(recentlyVisitedRaw);
    } catch (error) {
      Sentry.captureException(error);
      setRecentlyVisitedRaw({});
      return {};
    }
  }, [recentlyVisitedRaw, setRecentlyVisitedRaw]);

  const addToRecent = useCallback(
    (pageVisit: PageVisit) => {
      try {
        const parsedPageVisit = PageVisitSchema.parse(pageVisit);
        // Skip adding comments to recent visits

        setRecentlyVisitedRaw(prevRecentlyVisited => {
          if (!dashboardSlug) {
            return {};
          }
          const dashboardVisits = (prevRecentlyVisited[dashboardSlug] || []).filter(
            result => result.id !== parsedPageVisit.id,
          );
          const updatedDashboardVisits = [parsedPageVisit, ...dashboardVisits];
          return {
            ...prevRecentlyVisited,
            [dashboardSlug]: updatedDashboardVisits.slice(0, 5),
          };
        });
      } catch (e) {
        Sentry.captureException(e);
      }
    },
    [dashboardSlug, setRecentlyVisitedRaw],
  );

  const removeFromRecent = useCallback(
    (id: string) => {
      setRecentlyVisitedRaw(prevRecentlyVisited => {
        if (!dashboardSlug) {
          return prevRecentlyVisited;
        }
        const dashboardVisits = (prevRecentlyVisited[dashboardSlug] || []).filter(result => result.id !== id);
        return {
          ...prevRecentlyVisited,
          [dashboardSlug]: dashboardVisits,
        };
      });
    },
    [dashboardSlug, setRecentlyVisitedRaw],
  );

  const currentRecentlyVisited = dashboardSlug ? (recentlyVisited[dashboardSlug] ?? []) : [];

  return { recentlyVisited: currentRecentlyVisited, addToRecent, removeFromRecent };
}
