/* eslint-disable camelcase -- ecosyste.ms API fields are snake_case */

import '@testing-library/jest-dom';

import type { EcosystemsRepositorySnapshot, EcosystemsRepoSummary } from '../ecosystems';
import { fetchEcosystemsRepositoryInfo, toRepositorySnapshot } from '../ecosystems';

const REPO_ENTRY: EcosystemsRepoSummary = {
  packages: [
    {
      name: 'my-package',
      ecosystem: 'npm',
      maintainers: [
        { login: 'betree', name: null },
        { login: null, name: 'Jane Doe' },
      ],
      dependent_packages_count: 4,
      dependent_repos_count: 12,
      first_release_published_at: '2020-01-01T00:00:00.000Z',
      latest_release_published_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  repository: {
    full_name: 'foo/bar',
    owner: 'foo',
    description: 'A test repository',
    stargazers_count: 42,
    forks_count: 7,
    fork: false,
    license: 'mit',
    archived: true,
    created_at: '2016-12-12T04:36:39.000Z',
    pushed_at: '2026-10-11T11:24:07.000Z',
    commit_stats: { total_commits: 120, total_committers: 8, last_synced_commit: 'abc123' },
  },
  contributors: { total_committers: 8 },
  issues: { issues_count: 3 },
  owner: { login: 'foo' },
};

describe('lib/ecosystems', () => {
  describe('toRepositorySnapshot', () => {
    it('projects the repository fields requested for the application data', () => {
      const snapshot = toRepositorySnapshot(REPO_ENTRY);
      const expected: EcosystemsRepositorySnapshot = {
        fullName: 'foo/bar',
        owner: 'foo',
        description: 'A test repository',
        stars: 42,
        forks: 7,
        isFork: false,
        license: 'mit',
        archived: true,
        createdAt: '2016-12-12T04:36:39.000Z',
        lastCommitAt: '2026-10-11T11:24:07.000Z',
        lastCommitSha: 'abc123',
        commitStats: { totalCommits: 120, totalCommitters: 8 },
        packages: [
          {
            name: 'my-package',
            ecosystem: 'npm',
            maintainers: [
              { login: 'betree', name: null },
              { login: null, name: 'Jane Doe' },
            ],
            dependentPackagesCount: 4,
            dependentReposCount: 12,
            firstReleasePublishedAt: '2020-01-01T00:00:00.000Z',
            latestReleasePublishedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      expect(snapshot).toEqual(expected);
    });

    it('supports entries without repository or packages', () => {
      const snapshot = toRepositorySnapshot({
        packages: [],
        repository: null,
        contributors: null,
        issues: null,
        owner: null,
      });

      expect(snapshot).toEqual({
        fullName: null,
        owner: null,
        description: null,
        stars: null,
        forks: null,
        isFork: null,
        license: null,
        archived: null,
        createdAt: null,
        lastCommitAt: null,
        lastCommitSha: null,
        commitStats: null,
        packages: [],
      });
    });
  });

  describe('fetchEcosystemsRepositoryInfo', () => {
    let fetchStub: jest.Mock;
    const originalFetch = global.fetch;

    beforeEach(() => {
      fetchStub = jest.fn();
      global.fetch = fetchStub as unknown as typeof fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('proxies the repository URL to the API endpoint', async () => {
      fetchStub.mockResolvedValue({ ok: true, json: () => Promise.resolve(REPO_ENTRY) });

      const result = await fetchEcosystemsRepositoryInfo('https://github.com/foo/bar?x=1&y=2');

      expect(fetchStub).toHaveBeenCalledWith(
        '/api/ecosystems/repository?url=https%3A%2F%2Fgithub.com%2Ffoo%2Fbar%3Fx%3D1%26y%3D2',
      );
      expect(result).toEqual(REPO_ENTRY);
    });

    it('throws the API error message when the request fails', async () => {
      fetchStub.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(fetchEcosystemsRepositoryInfo('https://github.com/foo/bar')).rejects.toThrow('Rate limit exceeded');
    });
  });
});
