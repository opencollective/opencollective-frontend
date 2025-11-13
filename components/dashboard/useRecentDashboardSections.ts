import { useCallback, useEffect, useMemo } from 'react';

import useLocalStorage from '@/lib/hooks/useLocalStorage';
import { getFromLocalStorage } from '@/lib/local-storage';

const MAX_RECENT_SECTIONS = 5;
const MIN_RECENT_SECTIONS = 3;
const DEFAULT_SLUG = 'default';

const parseStoredSections = (value: string | null): string[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const useRecentDashboardSections = (activeSlug: string | null | undefined) => {
  const workspaceSlug = activeSlug ?? DEFAULT_SLUG;
  const storageKey = useMemo(() => `oc.dashboard.recentSections.${workspaceSlug}`, [workspaceSlug]);
  const [recentSections, setRecentSections] = useLocalStorage<string[]>(storageKey, []);
  const pinnedStorageKey = useMemo(() => `oc.dashboard.pinnedSections.${workspaceSlug}`, [workspaceSlug]);
  const [pinnedSections, setPinnedSections] = useLocalStorage<string[]>(pinnedStorageKey, []);

  useEffect(() => {
    const storedSections = parseStoredSections(getFromLocalStorage(storageKey));

    setRecentSections(previous => {
      if (!previous || previous.length === 0) {
        return storedSections;
      }

      const hasChanged =
        storedSections.length !== previous.length || storedSections.some((value, index) => value !== previous[index]);

      return hasChanged ? storedSections : previous;
    });
  }, [setRecentSections, storageKey]);

  useEffect(() => {
    const storedPinnedSections = parseStoredSections(getFromLocalStorage(pinnedStorageKey));

    setPinnedSections(previous => {
      if (!previous || previous.length === 0) {
        return storedPinnedSections;
      }

      const hasChanged =
        storedPinnedSections.length !== previous.length ||
        storedPinnedSections.some((value, index) => value !== previous[index]);

      return hasChanged ? storedPinnedSections : previous;
    });
  }, [pinnedStorageKey, setPinnedSections]);

  const normalizedPinnedSections = useMemo(
    () => (Array.isArray(pinnedSections) ? pinnedSections.filter(Boolean) : []),
    [pinnedSections],
  );

  const normalizedRecentSections = useMemo(() => {
    if (!Array.isArray(recentSections)) {
      return [];
    }

    return recentSections.filter(section => section && !normalizedPinnedSections.includes(section));
  }, [recentSections, normalizedPinnedSections]);

  const maxRecentSections = useMemo(() => {
    if (normalizedPinnedSections.length === 0) {
      return MAX_RECENT_SECTIONS;
    }
    if (normalizedPinnedSections.length === 1) {
      return Math.max(MIN_RECENT_SECTIONS, MAX_RECENT_SECTIONS - 1);
    }
    return MIN_RECENT_SECTIONS;
  }, [normalizedPinnedSections]);

  useEffect(() => {
    setRecentSections(previousSections => {
      const previous = Array.isArray(previousSections) ? previousSections : [];
      const filtered = previous.filter(section => section && !normalizedPinnedSections.includes(section));
      const next = filtered.slice(0, maxRecentSections);

      const hasChanged = next.length !== previous.length || next.some((value, index) => value !== previous[index]);

      return hasChanged ? next : previous;
    });
  }, [maxRecentSections, normalizedPinnedSections, setRecentSections]);

  const addRecentSection = useCallback(
    (section: string | null | undefined) => {
      if (!section || normalizedPinnedSections.includes(section)) {
        return;
      }

      setRecentSections(previousSections => {
        const previous = Array.isArray(previousSections) ? previousSections : [];
        const filteredPrevious = previous.filter(
          existing => existing !== section && !normalizedPinnedSections.includes(existing),
        );
        const next = [section, ...filteredPrevious].slice(0, maxRecentSections);

        const hasChanged = next.length !== previous.length || next.some((value, index) => value !== previous[index]);

        return hasChanged ? next : previous;
      });
    },
    [maxRecentSections, normalizedPinnedSections, setRecentSections],
  );

  const pinSection = useCallback(
    (section: string | null | undefined) => {
      if (!section) {
        return;
      }

      setPinnedSections(previousSections => {
        const previous = Array.isArray(previousSections) ? previousSections : [];
        if (previous.includes(section)) {
          return previous;
        }

        const next = [...previous, section];
        return next;
      });

      setRecentSections(previousSections => {
        const previous = Array.isArray(previousSections) ? previousSections : [];
        const next = previous.filter(existing => existing !== section);
        return next.length === previous.length ? previous : next;
      });
    },
    [setPinnedSections, setRecentSections],
  );

  const unpinSection = useCallback(
    (section: string | null | undefined) => {
      if (!section) {
        return;
      }

      const pinnedAfterRemoval = normalizedPinnedSections.filter(existing => existing !== section);

      setPinnedSections(previousSections => {
        const previous = Array.isArray(previousSections) ? previousSections : [];
        if (previous.length === pinnedAfterRemoval.length) {
          return previous;
        }

        return pinnedAfterRemoval;
      });

      setRecentSections(previousSections => {
        const previous = Array.isArray(previousSections) ? previousSections : [];
        const filteredPrevious = previous.filter(
          existing => existing !== section && !pinnedAfterRemoval.includes(existing),
        );
        const next = [section, ...filteredPrevious].slice(0, maxRecentSections);

        const hasChanged = next.length !== previous.length || next.some((value, index) => value !== previous[index]);

        return hasChanged ? next : previous;
      });
    },
    [maxRecentSections, normalizedPinnedSections, setPinnedSections, setRecentSections],
  );

  const togglePinnedSection = useCallback(
    (section: string | null | undefined) => {
      if (!section) {
        return;
      }

      if (normalizedPinnedSections.includes(section)) {
        unpinSection(section);
      } else {
        pinSection(section);
      }
    },
    [normalizedPinnedSections, pinSection, unpinSection],
  );

  const isSectionPinned = useCallback(
    (section: string | null | undefined) => {
      if (!section) {
        return false;
      }

      return normalizedPinnedSections.includes(section);
    },
    [normalizedPinnedSections],
  );

  return {
    recentSections: normalizedRecentSections,
    pinnedSections: normalizedPinnedSections,
    addRecentSection,
    pinSection,
    unpinSection,
    togglePinnedSection,
    isSectionPinned,
  };
};

export type UseRecentDashboardSectionsReturn = ReturnType<typeof useRecentDashboardSections>;
