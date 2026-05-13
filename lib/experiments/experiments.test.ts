import { Experiment, isExperimentEnabled } from './experiments';

describe('experiments', () => {
  const originalOcEnv = process.env.OC_ENV;
  const originalRolloutPercentage = process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
  const randomSpy = jest.spyOn(Math, 'random');

  beforeEach(() => {
    process.env.OC_ENV = 'development';
    delete process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    randomSpy.mockReset();
  });

  afterAll(() => {
    process.env.OC_ENV = originalOcEnv;
    if (originalRolloutPercentage === undefined) {
      delete process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
    } else {
      process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE = originalRolloutPercentage;
    }
    randomSpy.mockRestore();
  });

  it('keeps the new platform tip flow disabled by default in e2e', () => {
    process.env.OC_ENV = 'e2e';
    randomSpy.mockReturnValue(0);

    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { host: { slug: 'opensource', legacyId: 11004 } },
      }),
    ).toBe(false);
  });

  it('enables the new platform tip flow for Open Source Collective host', () => {
    randomSpy.mockReturnValue(0.99);

    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { host: { slug: 'opensource' } },
      }),
    ).toBe(true);
  });

  it('uses the configured rollout percentage for other hosts', () => {
    process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE = '25';
    randomSpy.mockReturnValueOnce(0.24).mockReturnValueOnce(0.25);

    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { host: { slug: 'other-host' } },
      }),
    ).toBe(true);
    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { host: { slug: 'other-host' } },
      }),
    ).toBe(false);
  });

  it('lets the URL override force the new platform tip flow', () => {
    process.env.OC_ENV = 'e2e';
    window.history.replaceState({}, '', `/?${Experiment.NEW_PLATFORM_TIP_FLOW}=true`);

    expect(isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW)).toBe(true);
  });
});
