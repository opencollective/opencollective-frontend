import { Experiment, isExperimentEnabled } from './experiments';

describe('experiments', () => {
  const originalOcEnv = process.env.OC_ENV;
  const originalRolloutPercentage = process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
  const originalOscTipRolloutPercentage = process.env.OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE;
  const randomSpy = jest.spyOn(Math, 'random');

  beforeEach(() => {
    process.env.OC_ENV = 'development';
    delete process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
    delete process.env.OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE;
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
    if (originalOscTipRolloutPercentage === undefined) {
      delete process.env.OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE;
    } else {
      process.env.OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE = originalOscTipRolloutPercentage;
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

  it('keeps the new platform tip flow disabled for Open Source Collective host', () => {
    process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE = '100';
    randomSpy.mockReturnValue(0);

    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { host: { slug: 'opensource' } },
      }),
    ).toBe(false);
    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { host: { legacyId: 11004 } },
      }),
    ).toBe(false);
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

  it('defaults to a 20% rollout when the percentage is not configured', () => {
    const context = { collective: { host: { slug: 'opensource' } } };

    // Below the default rollout percentage: tip proposed (experiment not enabled)
    randomSpy.mockReturnValueOnce(0.19);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);

    // At or above the default rollout percentage: tip hidden (experiment enabled)
    randomSpy.mockReturnValueOnce(0.2);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
  });

  it('uses the configured OSC platform tip rollout percentage', () => {
    process.env.OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE = '20';
    const context = { collective: { host: { slug: 'opensource' } } };

    // Below the rollout percentage: tip proposed (experiment not enabled)
    randomSpy.mockReturnValueOnce(0.19);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);

    // At or above the rollout percentage: tip hidden (experiment enabled)
    randomSpy.mockReturnValueOnce(0.2);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);

    // Full rollout: tip always proposed
    process.env.OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE = '100';
    randomSpy.mockReturnValueOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);
  });

  it('never hides the tip outside the Open Source Collective host', () => {
    randomSpy.mockReturnValue(0.99);

    expect(
      isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, {
        collective: { host: { slug: 'other-host' } },
      }),
    ).toBe(false);
  });
});
