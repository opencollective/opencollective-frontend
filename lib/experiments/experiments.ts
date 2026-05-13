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
    host?: {
      slug?: string;
      legacyId?: number | string;
    };
  };
};

const NON_RANDOMIZED_ENVS = ['ci', 'e2e', 'test'];
const OPEN_SOURCE_COLLECTIVE_HOST_SLUG = 'opensource';
const OPEN_SOURCE_COLLECTIVE_HOST_LEGACY_ID = 11004;
const DEFAULT_NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE = 50;

function getNewPlatformTipFlowRolloutPercentage(): number {
  const percentage = parseInt(process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE, 10);

  if (!Number.isFinite(percentage)) {
    return DEFAULT_NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
  }

  return Math.min(Math.max(percentage, 0), 100);
}

function isOpenSourceCollectiveHost(context?: ExperimentContext): boolean {
  const host = context?.collective?.host;

  return (
    host?.slug === OPEN_SOURCE_COLLECTIVE_HOST_SLUG || Number(host?.legacyId) === OPEN_SOURCE_COLLECTIVE_HOST_LEGACY_ID
  );
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

      if (isOpenSourceCollectiveHost(context)) {
        return true;
      }

      return Math.random() * 100 < getNewPlatformTipFlowRolloutPercentage();
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
