import { AmountTypes, TierTypes } from '../constants/tiers-types';
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

function getNewPlatformTipFlowRolloutPercentage(): number {
  const percentage = parseInt(process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE, 10);

  if (!Number.isFinite(percentage)) {
    return DEFAULT_NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
  }

  return Math.min(Math.max(percentage, 0), 100);
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
  // OSC-only A/B for measuring the impact of platform tips on conversion.
  // `true` means the tip step is hidden for this user.
  [Experiment.OPENSOURCE_PLATFORM_TIP_AB]: {
    enabled(_user, context): boolean {
      if (typeof window === 'undefined' || NON_RANDOMIZED_ENVS.includes(process.env.OC_ENV)) {
        return false;
      }

      if (!isOpenSourceCollectiveHost(context?.collective?.host)) {
        return false;
      }

      return Math.random() < 0.5;
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
