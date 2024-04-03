import LoggedInUser from '../LoggedInUser';

export const enum Experiment {
  NEW_PLATFORM_TIP_FLOW = 'newPlatformTipFlow',
}

type ExperimentConfig = {
  enabled: (user?: LoggedInUser) => boolean;
};

const experiments: Record<Experiment, ExperimentConfig> = {
  [Experiment.NEW_PLATFORM_TIP_FLOW]: {
    enabled(): boolean {
      return true;
    },
  },
};

export function isExperimentEnabled(experiment: Experiment, loggedInUser?: LoggedInUser): boolean {
  return experiments[experiment]?.enabled(loggedInUser);
}
