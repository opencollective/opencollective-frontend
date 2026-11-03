import { getEnvVar } from '../env-utils';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from '../local-storage';
import type LoggedInUser from '../LoggedInUser';
import { parseToBoolean } from '../utils';

export const enum Experiment {
  NEW_PLATFORM_TIP_FLOW = 'newPlatformTipFlow',
}

type ExperimentConfig = {
  enabled: (user?: LoggedInUser, context?: ExperimentContext) => boolean;
};

type ExperimentContext = {
  collective?: {
    slug?: string;
    host?: {
      slug?: string;
      legacyId?: number | string;
    };
  };
};

const NON_RANDOMIZED_ENVS = ['ci', 'e2e', 'test'];

// Read through `getEnvVar` (not `process.env`) so the value comes from `__NEXT_DATA__.env` at
// runtime: the percentage can be changed with a config var update alone, no rebuild needed.
// The default lives in env.js.

// Only a plain integer is accepted: parseInt would silently turn a typo like "1e3" or "7.5" into
// a split nobody intended, so anything else falls back to the pre-experiment behaviour (old tip UI).
function getNewPlatformTipFlowRolloutPercentage(): number {
  const rawValue = getEnvVar('NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE');
  if (typeof rawValue !== 'string' || !/^\d+$/.test(rawValue)) {
    return 0;
  }

  return Math.min(parseInt(rawValue, 10), 100);
}

// Sticky per-browser, per-collective draws for the platform tip experiment. Without
// persistence, every page load re-rolls the arm: a contributor who reloads mid-flow can switch
// arms, a one-way drift that selects deliberate (larger) contributions into one arm and biases
// the comparison. Draws are stored per collective slug so a visitor keeps their arm across visits
// to the same collective, while different collectives get independent draws. Stored draws are
// keyed to the rollout percentage that produced them: when the percentage changes, stale draws
// are re-rolled so the new split applies immediately.
type StoredDraws = Record<string, { enabled: boolean; pct: number }>;

function getStickyDraw(
  storageKey: string,
  collectiveSlug: string,
  rolloutPercentage: number,
  draw: () => boolean,
): boolean {
  let draws: StoredDraws;
  try {
    const parsed = JSON.parse(getFromLocalStorage(storageKey));
    // Guard against stored values that parse but aren't a plain object (true, 42, "foo", []):
    // assigning a property to a primitive throws in strict mode, and arrays don't stringify
    // their named properties, so either would break or silently disable the stickiness.
    draws = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    draws = {};
  }

  const stored = draws[collectiveSlug];
  if (stored && stored.pct === rolloutPercentage && typeof stored.enabled === 'boolean') {
    return stored.enabled;
  }

  const enabled = draw();
  draws[collectiveSlug] = { enabled, pct: rolloutPercentage };
  setLocalStorage(storageKey, JSON.stringify(draws));
  return enabled;
}

// Reads ?<experiment>=<value> from the current URL to force a variant.
// Returns true/false to force, or undefined when not present.
function getOverride(experiment: Experiment): boolean | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const value = new URLSearchParams(window.location.search).get(experiment);
  if (value === null) {
    return undefined;
  }
  return parseToBoolean(value);
}

const experiments: Record<Experiment, ExperimentConfig> = {
  [Experiment.NEW_PLATFORM_TIP_FLOW]: {
    enabled(_user, context): boolean {
      if (typeof window === 'undefined' || NON_RANDOMIZED_ENVS.includes(process.env.OC_ENV)) {
        return false;
      }

      // A/B for every host: NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE is the share
      // of contributors that get the new tip UI (see env.js for the default). The variant
      // is persisted on the order as data.isNewPlatformTipFlow.
      const rolloutPercentage = getNewPlatformTipFlowRolloutPercentage();
      const draw = () => Math.random() * 100 < rolloutPercentage;
      const collectiveSlug = context?.collective?.slug;
      if (!collectiveSlug) {
        return draw();
      }

      return getStickyDraw(LOCAL_STORAGE_KEYS.NEW_PLATFORM_TIP_FLOW_DRAWS, collectiveSlug, rolloutPercentage, draw);
    },
  },
};

export function isExperimentEnabled(
  experiment: Experiment,
  loggedInUser?: LoggedInUser,
  context?: ExperimentContext,
): boolean {
  const override = getOverride(experiment);
  if (override !== undefined) {
    return override;
  }
  return experiments[experiment]?.enabled(loggedInUser, context);
}
