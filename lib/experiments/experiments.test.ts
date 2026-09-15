import { Experiment, isExperimentEnabled } from './experiments';

describe('experiments', () => {
  const originalOcEnv = process.env.OC_ENV;
  const originalRolloutPercentage = process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
  // Draws read crypto.getRandomValues (see randomPercent in experiments.ts). The spy queues
  // fractional values like Math.random would produce; ceil keeps boundary fractions (0.2, 0.5)
  // exactly on their threshold after the Uint32 round-trip.
  const randomSpy = jest.spyOn(window.crypto, 'getRandomValues');
  const drawImpl = (fraction: number) => (array: Uint32Array) => {
    array[0] = Math.ceil(fraction * 2 ** 32);
    return array;
  };
  const mockDrawOnce = (...fractions: number[]) => {
    fractions.forEach(f => randomSpy.mockImplementationOnce(drawImpl(f) as never));
  };
  const mockDrawAlways = (fraction: number) => randomSpy.mockImplementation(drawImpl(fraction) as never);

  // The OSC rollout percentage is read through getEnvVar, which in the browser resolves from
  // window.__NEXT_DATA__.env. Simulate that path so the tests cover what production executes.
  const setOscRolloutPercentage = (value: string) => {
    (window as any).__NEXT_DATA__.env.OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE = value;
  };

  beforeEach(() => {
    process.env.OC_ENV = 'development';
    delete process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
    (process as any).browser = true;
    (window as any).__NEXT_DATA__ = { env: {} };
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
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
    delete (process as any).browser;
    delete (window as any).__NEXT_DATA__;
    randomSpy.mockRestore();
  });

  it('keeps the new platform tip flow disabled by default in e2e', () => {
    process.env.OC_ENV = 'e2e';
    mockDrawAlways(0);

    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { host: { slug: 'opensource', legacyId: 11004 } },
      }),
    ).toBe(false);
  });

  it('always enables the new platform tip flow for Open Source Collective host', () => {
    // Even with the rollout at 0, OSC gets the new tip UI deterministically
    process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE = '0';
    mockDrawAlways(0.99);

    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { host: { slug: 'opensource' } },
      }),
    ).toBe(true);
    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { host: { legacyId: 11004 } },
      }),
    ).toBe(true);
    expect(randomSpy).not.toHaveBeenCalled();
  });

  it('uses the configured rollout percentage for other hosts', () => {
    process.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE = '25';
    mockDrawOnce(0.24, 0.25);

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

  it('defaults to a 50% rollout when the percentage is not configured', () => {
    const context = { collective: { host: { slug: 'opensource' } } };

    // Below the default rollout percentage: tip proposed (experiment not enabled)
    mockDrawOnce(0.49);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);

    // At or above the default rollout percentage: tip hidden (experiment enabled)
    mockDrawOnce(0.5);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
  });

  it('uses the configured OSC platform tip rollout percentage', () => {
    setOscRolloutPercentage('20');
    const context = { collective: { host: { slug: 'opensource' } } };

    // Below the rollout percentage: tip proposed (experiment not enabled)
    mockDrawOnce(0.19);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);

    // At or above the rollout percentage: tip hidden (experiment enabled)
    mockDrawOnce(0.2);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);

    // Full rollout: tip always proposed
    setOscRolloutPercentage('100');
    mockDrawOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);
  });

  it('never hides the tip outside the Open Source Collective host', () => {
    mockDrawAlways(0.99);

    expect(
      isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, {
        collective: { host: { slug: 'other-host' } },
      }),
    ).toBe(false);
  });

  it('keeps the OSC tip draw sticky per collective across page loads', () => {
    const context = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };

    // First load draws the tip-hidden arm and persists it
    mockDrawOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);

    // Subsequent loads reuse the stored draw instead of re-rolling
    mockDrawOnce(0);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('draws independently for different collectives', () => {
    const webpack = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };
    const curl = { collective: { slug: 'curl', host: { slug: 'opensource' } } };

    mockDrawOnce(0.99, 0);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, webpack)).toBe(true);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, curl)).toBe(false);

    // Each collective keeps its own arm
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, webpack)).toBe(true);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, curl)).toBe(false);
  });

  it('re-rolls stored draws when the rollout percentage changes', () => {
    const context = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };

    setOscRolloutPercentage('20');
    mockDrawOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);

    // Percentage changed: the stored draw is stale, a new one is made under the new split
    setOscRolloutPercentage('100');
    mockDrawOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);

    // And the new draw is sticky in turn
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  it('falls back to a per-load draw when the context has no collective slug', () => {
    const context = { collective: { host: { slug: 'opensource' } } };

    mockDrawOnce(0.99, 0);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);
  });

  it('survives corrupted stored draws', () => {
    window.localStorage.setItem('oscTipExperimentDraws', '{not json');
    const context = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };

    mockDrawOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);

    // The corrupted blob was replaced by a valid one holding the new draw
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it.each(['true', '42', '"foo"', '[]'])('survives stored draws holding valid but wrongly shaped JSON (%s)', stored => {
    window.localStorage.setItem('oscTipExperimentDraws', stored);
    const context = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };

    // Neither throws nor loses stickiness: the bad value is replaced by a fresh draw map
    mockDrawOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });
});
