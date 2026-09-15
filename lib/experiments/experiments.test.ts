import { Experiment, isExperimentEnabled } from './experiments';

describe('experiments', () => {
  const originalOcEnv = process.env.OC_ENV;
  const randomSpy = jest.spyOn(Math, 'random');

  // The rollout percentages are read through getEnvVar, which in the browser resolves from
  // window.__NEXT_DATA__.env. Simulate that path so the tests cover what production executes.
  const setNewFlowRolloutPercentage = (value: string) => {
    (window as any).__NEXT_DATA__.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE = value;
  };
  const setOscRolloutPercentage = (value: string) => {
    (window as any).__NEXT_DATA__.env.OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE = value;
  };

  beforeEach(() => {
    process.env.OC_ENV = 'development';
    (process as any).browser = true;
    // Seeded with the env.js defaults, which always populate __NEXT_DATA__.env in the running app
    (window as any).__NEXT_DATA__ = {
      env: { NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE: '50', OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE: '50' },
    };
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
  });

  afterEach(() => {
    randomSpy.mockReset();
  });

  afterAll(() => {
    process.env.OC_ENV = originalOcEnv;
    delete (process as any).browser;
    delete (window as any).__NEXT_DATA__;
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

  it('always enables the new platform tip flow for Open Source Collective host', () => {
    // Even with the rollout at 0, OSC gets the new tip UI deterministically
    setNewFlowRolloutPercentage('0');
    randomSpy.mockReturnValue(0.99);

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

  it('keeps the old platform tip flow for other hosts when the percentage is missing or unparseable', () => {
    randomSpy.mockReturnValue(0);

    delete (window as any).__NEXT_DATA__.env.NEW_PLATFORM_TIP_FLOW_ROLLOUT_PERCENTAGE;
    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { slug: 'babel', host: { slug: 'other-host' } },
      }),
    ).toBe(false);

    setNewFlowRolloutPercentage('fifty');
    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { slug: 'eslint', host: { slug: 'other-host' } },
      }),
    ).toBe(false);
  });

  it('uses the configured rollout percentage for other hosts', () => {
    setNewFlowRolloutPercentage('25');
    randomSpy.mockReturnValueOnce(0.24).mockReturnValueOnce(0.25);

    // Different collectives so each call gets its own draw
    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { slug: 'babel', host: { slug: 'other-host' } },
      }),
    ).toBe(true);
    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { slug: 'eslint', host: { slug: 'other-host' } },
      }),
    ).toBe(false);
  });

  it('keeps the new platform tip flow draw sticky per collective across page loads', () => {
    const context = { collective: { slug: 'babel', host: { slug: 'other-host' } } };

    // First load draws the new UI arm and persists it
    randomSpy.mockReturnValueOnce(0.1);
    expect(isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, context)).toBe(true);

    // Subsequent loads reuse the stored draw instead of re-rolling
    randomSpy.mockReturnValueOnce(0.99);
    expect(isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, context)).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('re-rolls stored new platform tip flow draws when the rollout percentage changes', () => {
    const context = { collective: { slug: 'babel', host: { slug: 'other-host' } } };

    setNewFlowRolloutPercentage('50');
    randomSpy.mockReturnValueOnce(0.1);
    expect(isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, context)).toBe(true);

    // Percentage changed: the stored draw is stale, a new one is made under the new split
    setNewFlowRolloutPercentage('0');
    randomSpy.mockReturnValueOnce(0.1);
    expect(isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, context)).toBe(false);

    // And the new draw is sticky in turn
    expect(isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, context)).toBe(false);
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  it('stores new platform tip flow draws separately from the OSC tip experiment draws', () => {
    const newFlow = { collective: { slug: 'babel', host: { slug: 'other-host' } } };
    const osc = { collective: { slug: 'babel', host: { slug: 'opensource' } } };

    randomSpy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.99);
    expect(isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, newFlow)).toBe(true);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, osc)).toBe(true);

    expect(JSON.parse(window.localStorage.getItem('newPlatformTipFlowDraws'))).toEqual({
      babel: { enabled: true, pct: 50 },
    });
    expect(JSON.parse(window.localStorage.getItem('oscTipExperimentDraws'))).toEqual({
      babel: { enabled: true, pct: 50 },
    });
  });

  it.each(['100%', '1e3', ' 50', '7.5', ''])('falls back when the percentage is not a plain integer (%j)', value => {
    setNewFlowRolloutPercentage(value);
    setOscRolloutPercentage(value);
    randomSpy.mockReturnValue(0.99);

    // New flow falls back to 0: old UI
    expect(
      isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, undefined, {
        collective: { slug: 'babel', host: { slug: 'other-host' } },
      }),
    ).toBe(false);
    // OSC falls back to 100: tip always proposed
    expect(
      isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, {
        collective: { slug: 'webpack', host: { slug: 'opensource' } },
      }),
    ).toBe(false);
  });

  it('lets the URL override force the new platform tip flow', () => {
    process.env.OC_ENV = 'e2e';
    window.history.replaceState({}, '', `/?${Experiment.NEW_PLATFORM_TIP_FLOW}=true`);

    expect(isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW)).toBe(true);
  });

  it('always proposes the tip when the OSC percentage is missing or unparseable', () => {
    const context = { collective: { host: { slug: 'opensource' } } };
    randomSpy.mockReturnValue(0.99);

    delete (window as any).__NEXT_DATA__.env.OSC_PLATFORM_TIP_ROLLOUT_PERCENTAGE;
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);

    setOscRolloutPercentage('fifty');
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);
  });

  it('uses the configured OSC platform tip rollout percentage', () => {
    setOscRolloutPercentage('20');
    const context = { collective: { host: { slug: 'opensource' } } };

    // Below the rollout percentage: tip proposed (experiment not enabled)
    randomSpy.mockReturnValueOnce(0.19);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);

    // At or above the rollout percentage: tip hidden (experiment enabled)
    randomSpy.mockReturnValueOnce(0.2);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);

    // Full rollout: tip always proposed
    setOscRolloutPercentage('100');
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

  it('keeps the OSC tip draw sticky per collective across page loads', () => {
    const context = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };

    // First load draws the tip-hidden arm and persists it
    randomSpy.mockReturnValueOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);

    // Subsequent loads reuse the stored draw instead of re-rolling
    randomSpy.mockReturnValueOnce(0);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('draws independently for different collectives', () => {
    const webpack = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };
    const curl = { collective: { slug: 'curl', host: { slug: 'opensource' } } };

    randomSpy.mockReturnValueOnce(0.99).mockReturnValueOnce(0);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, webpack)).toBe(true);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, curl)).toBe(false);

    // Each collective keeps its own arm
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, webpack)).toBe(true);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, curl)).toBe(false);
  });

  it('re-rolls stored draws when the rollout percentage changes', () => {
    const context = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };

    setOscRolloutPercentage('20');
    randomSpy.mockReturnValueOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);

    // Percentage changed: the stored draw is stale, a new one is made under the new split
    setOscRolloutPercentage('100');
    randomSpy.mockReturnValueOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);

    // And the new draw is sticky in turn
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  it('falls back to a per-load draw when the context has no collective slug', () => {
    const context = { collective: { host: { slug: 'opensource' } } };

    randomSpy.mockReturnValueOnce(0.99).mockReturnValueOnce(0);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(false);
  });

  it('survives corrupted stored draws', () => {
    window.localStorage.setItem('oscTipExperimentDraws', '{not json');
    const context = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };

    randomSpy.mockReturnValueOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);

    // The corrupted blob was replaced by a valid one holding the new draw
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it.each(['true', '42', '"foo"', '[]'])('survives stored draws holding valid but wrongly shaped JSON (%s)', stored => {
    window.localStorage.setItem('oscTipExperimentDraws', stored);
    const context = { collective: { slug: 'webpack', host: { slug: 'opensource' } } };

    // Neither throws nor loses stickiness: the bad value is replaced by a fresh draw map
    randomSpy.mockReturnValueOnce(0.99);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, undefined, context)).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });
});
