import { summarizeCiBaseline } from './ci-baseline';

const job = (name: string, startedAt: string, completedAt: string, conclusion = 'success') => ({
  name,
  conclusion,
  startedAt: `2026-11-05T${startedAt}Z`,
  completedAt: `2026-11-05T${completedAt}Z`,
});

describe('summarizeCiBaseline', () => {
  const runs = [
    {
      id: 1,
      url: 'https://example/1',
      jobs: [
        job('build', '10:00:00', '10:03:00'),
        job('e2e / e2e (0*.(js|ts))', '10:04:00', '10:11:00'),
        job('e2e / e2e (1*.(js|ts))', '10:04:00', '10:12:00'),
        job('e2e / e2e (2*.(js|ts))', '10:04:00', '10:15:00', 'failure'),
        job('e2e / e2e (3*.(js|ts))', '10:05:00', '10:12:00'),
        job('e2e / e2e (4*.(js|ts))', '10:04:00', '10:14:00'),
        job('e2e-playwright / playwright smoke', '10:04:00', '10:14:00'),
      ],
    },
    {
      id: 2,
      url: 'https://example/2',
      jobs: [
        job('e2e / e2e (0*.(js|ts))', '11:00:00', '11:07:00'),
        job('e2e / e2e (1*.(js|ts))', '11:00:00', '11:08:00'),
        job('e2e / e2e (2*.(js|ts))', '11:00:00', '11:11:00'),
        job('e2e / e2e (3*.(js|ts))', '11:00:00', '11:07:00'),
        job('e2e / e2e (4*.(js|ts))', '11:00:00', '11:09:00'),
        job('e2e-playwright / playwright smoke', '11:00:00', '11:08:00', 'failure'),
      ],
    },
    // Cancelled before the shards ran: not a baseline sample.
    { id: 3, url: 'https://example/3', jobs: [job('build', '12:00:00', '12:01:00', 'cancelled')] },
  ];
  const summary = summarizeCiBaseline(runs);

  it('measures the five Cypress shards as wall time from first start to last finish, and as summed job minutes', () => {
    expect(summary.runs).toBe(2);
    expect(summary.cypress.wallMin).toEqual({ n: 2, median: 11, min: 11, max: 11, p25: 11, p75: 11 });
    expect(summary.cypress.jobMin.median).toBe(42.5);
    expect(summary.cypress.shards['2*'].durationMin.median).toBe(11);
  });

  it('counts failures per shard and for the duplicate Playwright pilot job, whose minutes are reported separately', () => {
    expect(summary.cypress.shards['2*'].failures).toEqual([{ id: 1, url: 'https://example/1' }]);
    expect(summary.cypress.shards['4*'].failures).toEqual([]);
    expect(summary.playwright.jobMin).toEqual({ n: 2, median: 9, min: 8, max: 10, p25: 8.5, p75: 9.5 });
    expect(summary.playwright.failures).toEqual([{ id: 2, url: 'https://example/2' }]);
  });
});
