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
    topics: ['opencollective', 'react'],
    archived: true,
    created_at: '2016-12-12T04:36:39.000Z',
    pushed_at: '2026-10-11T11:24:07.000Z',
    commit_stats: { total_commits: 120, total_committers: 8, last_synced_commit: 'abc123' },
  },
  contributors: { total_committers: 8, total_bot_committers: 2 },
  issues: { issues_count: 3 },
  owner: { login: 'foo', kind: 'organization' },
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
        topics: ['opencollective', 'react'],
        ownerKind: 'organization',
        archived: true,
        createdAt: '2016-12-12T04:36:39.000Z',
        lastCommitAt: '2026-10-11T11:24:07.000Z',
        lastCommitSha: 'abc123',
        commitStats: { totalCommits: 120, totalCommitters: 8, botCommitters: 2 },
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

    it('counts human committers only, excluding bots, and keeps the bot count', () => {
      const snapshot = toRepositorySnapshot({
        ...REPO_ENTRY,
        repository: {
          ...REPO_ENTRY.repository,
          commit_stats: { total_commits: 120, total_committers: 5, last_synced_commit: 'abc123' },
        },
        packages: [
          {
            ...REPO_ENTRY.packages[0],
            repo_metadata: {
              commit_stats: { total_commits: 120, total_committers: 9, last_synced_commit: 'abc123' },
            },
          },
        ],
        contributors: {
          total_committers: 12,
          total_bot_committers: 4,
          past_year_total_committers: 8,
          past_year_total_bot_committers: 2,
        },
      });

      expect(snapshot.commitStats).toEqual({ totalCommits: 120, totalCommitters: 9, botCommitters: 4 });
    });

    it('detects the applicant in the past-year committers by email', () => {
      const snapshot = toRepositorySnapshot(
        {
          ...REPO_ENTRY,
          contributors: {
            ...REPO_ENTRY.contributors,
            past_year_committers: [
              { name: 'Jane Doe', email: 'JANE@example.com', login: 'jane', count: 12 },
              { name: 'No Email', email: null, login: 'no-email', count: 3 },
            ],
          },
        },
        { applicantEmail: ' jane@example.com ' },
      );

      expect(snapshot.applicantIsContributor).toBe(true);
      expect(snapshot.applicantContribution).toEqual({
        login: 'jane',
        name: 'Jane Doe',
        email: 'JANE@example.com',
        count: 12,
      });
    });

    it('reports when the applicant is not a past-year committer', () => {
      const snapshot = toRepositorySnapshot(
        {
          ...REPO_ENTRY,
          contributors: { ...REPO_ENTRY.contributors, past_year_committers: [] },
        },
        { applicantEmail: 'nobody@example.com' },
      );

      expect(snapshot.applicantIsContributor).toBe(false);
      expect(snapshot.applicantContribution).toBeNull();
    });

    it('ignores .local email addresses', () => {
      const entry = {
        ...REPO_ENTRY,
        contributors: {
          ...REPO_ENTRY.contributors,
          past_year_committers: [{ name: 'Local Dev', email: 'dev@build.local', login: 'dev', count: 2 }],
        },
      };

      // A .local applicant is not matched at all
      const localApplicantSnapshot = toRepositorySnapshot(entry, { applicantEmail: 'dev@build.local' });
      expect(localApplicantSnapshot).not.toHaveProperty('applicantIsContributor');
      expect(localApplicantSnapshot).not.toHaveProperty('applicantContribution');

      // A .local committer is not considered for a regular applicant
      expect(toRepositorySnapshot(entry, { applicantEmail: 'jane@example.com' })).toEqual(
        expect.objectContaining({ applicantIsContributor: false, applicantContribution: null }),
      );
    });

    it('falls back to the contributors commit count when the repository has no commit stats', () => {
      const snapshot = toRepositorySnapshot({
        ...REPO_ENTRY,
        repository: null,
        contributors: { total_committers: 3, total_commits: 42 },
      });

      expect(snapshot.commitStats).toEqual({ totalCommits: 42, totalCommitters: 3 });
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
        topics: [],
        ownerKind: null,
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
        expect.objectContaining({ signal: expect.anything() }),
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

    it('throws when a successful response cannot be parsed', async () => {
      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.reject(new Error('invalid json')) });
      await expect(fetchEcosystemsRepositoryInfo('https://github.com/foo/bar')).rejects.toThrow(
        /Failed to parse the repository information/,
      );

      fetchStub.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) });
      await expect(fetchEcosystemsRepositoryInfo('https://github.com/foo/bar')).rejects.toThrow(
        /Failed to parse the repository information/,
      );
    });
  });
});
