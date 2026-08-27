import { AmountTypes, TierTypes } from '../constants/tiers-types';
import { getEnvVar } from '../env-utils';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, setLocalStorage } from '../local-storage';
import type LoggedInUser from '../LoggedInUser';
import { parseToBoolean } from '../utils';

export const enum Experiment {
  NEW_PLATFORM_TIP_FLOW = 'newPlatformTipFlow',
  OPENSOURCE_PLATFORM_TIP_AB = 'opensourcePlatformTipAb',
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
const OPEN_SOURCE_COLLECTIVE_HOST_SLUG = 'opensource';
const OPEN_SOURCE_COLLECTIVE_HOST_LEGACY_ID = 11004;
const DEFAULT_NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE = 0;
const DEFAULT_OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE = 50;

function getRolloutPercentage(rawValue: string, defaultValue: number): number {
  const percentage = parseInt(rawValue, 10);

  if (!Number.isFinite(percentage)) {
    return defaultValue;
  }

  return Math.min(Math.max(percentage, 0), 100);
}

function getNewPlatformTipFlowRolloutPercentage(): number {
  return getRolloutPercentage(
    process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE,
    DEFAULT_NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE,
  );
}

// Read through `getEnvVar` (not `process.env`) so the value comes from `__NEXT_DATA__.env` at
// runtime: the percentage can be changed with a config var update alone, no rebuild needed.
function getOscPlatformTipRolloutPercentage(): number {
  return getRolloutPercentage(
    getEnvVar('OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE'),
    DEFAULT_OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE,
  );
}

export function isOpenSourceCollectiveHost(host?: { slug?: string; legacyId?: number | string }): boolean {
  return (
    host?.slug === OPEN_SOURCE_COLLECTIVE_HOST_SLUG || Number(host?.legacyId) === OPEN_SOURCE_COLLECTIVE_HOST_LEGACY_ID
  );
}

// Loosely typed so a GraphQL account union (whose members don't all carry these fields) can be passed directly.
type PlatformTipCollective = {
  platformContributionAvailable?: boolean | null;
  host?: { slug?: string; legacyId?: number | string } | null;
  [key: string]: unknown;
};
type PlatformTipTier = {
  type?: string | null;
  amountType?: string | null;
  amount?: { valueInCents?: number | null } | null;
} | null;

// Whether the platform tip would be offered for this contribution, ignoring the OSC A/B experiment gate.
// Mirrors the non-experiment branches of the contribution flow's canHavePlatformTips().
export function platformTipApplies(collective?: PlatformTipCollective | null, tier?: PlatformTipTier): boolean {
  if (!collective?.platformContributionAvailable) {
    return false;
  } else if (!tier) {
    return true;
  } else if (tier.type === TierTypes.TICKET) {
    return false;
  } else if (tier.amountType === AmountTypes.FIXED && !tier.amount?.valueInCents) {
    return false;
  }
  return true;
}

// Whether this contribution falls within the OSC platform tip A/B experiment portion: an Open Source
// Collective host and a contribution where the tip would otherwise be offered. The arm itself is read
// from contributionPlatformTipEnabled (enabled = tip shown / control, not enabled = tip hidden / test),
// which is unambiguous once filtered to this portion.
export function isOscTipExperiment(collective?: PlatformTipCollective | null, tier?: PlatformTipTier): boolean {
  return isOpenSourceCollectiveHost(collective?.host) && platformTipApplies(collective, tier);
}

// Sticky per-browser, per-collective draws for the OSC platform tip experiment. Without
// persistence, every page load re-rolls the arm: a contributor who reloads mid-flow has an 80%
// chance of leaving the tip arm, a one-way drift that selects deliberate (larger) contributions
// into the holdout and biases the revenue comparison. Draws are stored per collective slug so a
// visitor keeps their arm across visits to the same collective, while different collectives get
// independent draws. Stored draws are keyed to the rollout percentage that produced them: when
// the percentage changes, stale draws are re-rolled so the new split applies immediately.
type StoredDraws = Record<string, { enabled: boolean; pct: number }>;

function getStickyDraw(collectiveSlug: string, rolloutPercentage: number): boolean {
  let draws: StoredDraws;
  try {
    const parsed = JSON.parse(getFromLocalStorage(LOCAL_STORAGE_KEYS.OSC_TIP_EXPERIMENT_DRAWS));
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

  const enabled = Math.random() * 100 >= rolloutPercentage;
  draws[collectiveSlug] = { enabled, pct: rolloutPercentage };
  setLocalStorage(LOCAL_STORAGE_KEYS.OSC_TIP_EXPERIMENT_DRAWS, JSON.stringify(draws));
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

      // Open Source Collective stays on the legacy flow for now, no A/B.
      if (isOpenSourceCollectiveHost(context?.collective?.host)) {
        return false;
      }

      return Math.random() * 100 < getNewPlatformTipFlowRolloutPercentage();
    },
  },
  // OSC-only experiment for measuring the impact of platform tips on contributions.
  // `true` means the tip step is hidden for this user. OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE
  // is the share of eligible contributions that get the tip proposed (default 50); the
  // remainder is the holdout where the tip is hidden. Equal arms keep the revenue comparison
  // centered and unbiased under the site's heavy-tailed contribution amounts. Set to 100 to
  // end the holdout.
  [Experiment.OPENSOURCE_PLATFORM_TIP_AB]: {
    enabled(_user, context): boolean {
      if (typeof window === 'undefined' || NON_RANDOMIZED_ENVS.includes(process.env.OC_ENV)) {
        return false;
      }

      if (!isOpenSourceCollectiveHost(context?.collective?.host)) {
        return false;
      }

      const rolloutPercentage = getOscPlatformTipRolloutPercentage();
      const collectiveSlug = context?.collective?.slug;
      if (!collectiveSlug) {
        return Math.random() * 100 >= rolloutPercentage;
      }

      return getStickyDraw(collectiveSlug, rolloutPercentage);
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
