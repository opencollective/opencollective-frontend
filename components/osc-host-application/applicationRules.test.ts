/**
 * Unit tests for the OSC application eligibility rules library.
 *
 * The rules and thresholds are calibrated on `OSC Host Application Review - October 2026.csv`
 * (see `application_rules.md` at the worktree root for the evidence).
 */

import type { EcosystemsRepositorySnapshot } from '../../lib/ecosystems';

import type { ApplicationFacts, RuleFlag, RuleId } from './applicationRules';
import {
  CONFIRMATION_MESSAGES,
  COPYRIGHT_KEYWORDS,
  evaluateApplication,
  EVENT_KEYWORDS,
  getContributors,
  getProjectAgeInMonths,
  getSubmissionGate,
  getUsage,
  isKnownGitHost,
  isOpenSourceLicense,
  isRepositoryUrl,
  toSpdxLicenseId,
} from './applicationRules';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RECENT_DATE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const repository = (overrides: Partial<EcosystemsRepositorySnapshot> = {}): EcosystemsRepositorySnapshot => ({
  fullName: 'foo/bar',
  owner: 'foo',
  ownerKind: 'organization',
  description: 'A test repository',
  stars: 42,
  forks: 20,
  isFork: false,
  license: 'mit',
  topics: ['opencollective'],
  archived: false,
  createdAt: '2020-01-01T00:00:00.000Z',
  lastCommitAt: RECENT_DATE,
  lastCommitSha: 'abc123',
  commitStats: { totalCommits: 120, totalCommitters: 8 },
  packages: [
    {
      name: 'my-package',
      ecosystem: 'npm',
      maintainers: [{ login: 'betree', name: null }],
      dependentPackagesCount: 4,
      dependentReposCount: 12,
      firstReleasePublishedAt: '2021-01-01T00:00:00.000Z',
      latestReleasePublishedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  ...overrides,
});

const facts = (overrides: Partial<ApplicationFacts> = {}): ApplicationFacts => ({
  typeOfProject: 'CODE',
  repositoryUrl: 'https://github.com/foo/bar',
  name: 'Foo bar',
  message: 'We build things together with our community of contributors and users.',
  description: 'We do things',
  teamSize: 2,
  repositoryInfoState: 'found',
  repository: repository(),
  applicationTextEngaged: true,
  ...overrides,
});

const ids = (flags: RuleFlag[]): RuleId[] => flags.map(flag => flag.id);
const flagById = (flags: RuleFlag[], id: RuleId) => flags.find(flag => flag.id === id);

// ─── Derived metrics ─────────────────────────────────────────────────────────

describe('applicationRules - metrics', () => {
  it('gets the contributor count from committers and package maintainers', () => {
    expect(getContributors(repository())).toBe(8); // max(8 committers, 1 maintainer)
    expect(getContributors(repository({ commitStats: null, packages: [] }))).toBeNull();
    expect(
      getContributors(
        repository({
          commitStats: { totalCommits: 1, totalCommitters: 2 },
          packages: [
            {
              ...repository().packages[0],
              maintainers: [
                { login: 'a', name: null },
                { login: 'b', name: null },
                { login: 'c', name: null },
              ],
            },
          ],
        }),
      ),
    ).toBe(3);
  });

  it('gets the usage as the max of forks and package dependents', () => {
    expect(getUsage(repository())).toBe(20); // max(20 forks, 12 dependent repos, 4 dependent packages)
    expect(getUsage(repository({ forks: 0 }))).toBe(12);
    expect(getUsage(repository({ forks: 0, packages: [] }))).toBe(0);
    expect(getUsage(null)).toBeNull();
  });

  it('gets the project age from the oldest of repository creation and first release', () => {
    const now = new Date('2026-10-01T00:00:00.000Z').getTime();
    const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
    expect(getProjectAgeInMonths(repository({ createdAt: daysAgo(90), packages: [] }), now)).toBe(3);
    expect(
      getProjectAgeInMonths(
        repository({
          createdAt: daysAgo(30),
          packages: [{ ...repository().packages[0], firstReleasePublishedAt: daysAgo(180) }],
        }),
        now,
      ),
    ).toBe(6); // the first release is the oldest timestamp
    expect(getProjectAgeInMonths(repository({ createdAt: null, packages: [] }), now)).toBeNull();
  });
});

// ─── URL and license helpers ─────────────────────────────────────────────────

describe('applicationRules - helpers', () => {
  it('detects repository-shaped URLs', () => {
    expect(isRepositoryUrl('https://github.com/foo/bar')).toBe(true);
    expect(isRepositoryUrl('https://github.com/foo/bar.git')).toBe(true);
    expect(isRepositoryUrl('https://git.mx-os.mx/org/repo')).toBe(true);
    expect(isRepositoryUrl('https://github.com')).toBe(false);
    expect(isRepositoryUrl('https://www.github.com/foo')).toBe(false);
    expect(isRepositoryUrl('https://borderobservatory.substack.com/')).toBe(false);
    expect(isRepositoryUrl('not-a-url')).toBe(false);
    expect(isRepositoryUrl('')).toBe(false);
  });

  it('knows the git hosts that ecosyste.ms can look up', () => {
    expect(isKnownGitHost('https://github.com/foo/bar')).toBe(true);
    expect(isKnownGitHost('https://www.gitlab.com/foo/bar')).toBe(true);
    expect(isKnownGitHost('https://codeberg.org/foo/bar')).toBe(true);
    expect(isKnownGitHost('https://git.mx-os.mx/org/repo')).toBe(false);
    expect(isKnownGitHost('not-a-url')).toBe(false);
  });

  it('maps repository licenses to SPDX ids and knows open source licenses', () => {
    expect(toSpdxLicenseId('mit')).toBe('MIT');
    expect(toSpdxLicenseId('Apache-2.0')).toBe('Apache-2.0');
    expect(toSpdxLicenseId('some-custom-license')).toBeNull();
    expect(toSpdxLicenseId(null)).toBeNull();
    expect(isOpenSourceLicense('mit')).toBe(true);
    expect(isOpenSourceLicense('CC-BY-NC-SA-4.0')).toBe(false);
    expect(isOpenSourceLicense('NOASSERTION')).toBe(false);
    expect(isOpenSourceLicense(null)).toBe(false);
  });
});

// ─── Rules ───────────────────────────────────────────────────────────────────

describe('applicationRules - errors', () => {
  it('flags solo or usage-less projects as no-community', () => {
    const solo = evaluateApplication(
      facts({ repository: repository({ commitStats: { totalCommits: 5, totalCommitters: 1 }, packages: [] }) }),
    );
    expect(flagById(solo, 'no-community')).toEqual({
      id: 'no-community',
      severity: 'error',
      field: 'repositoryUrl',
    });

    const noUsage = evaluateApplication(facts({ repository: repository({ forks: 0, packages: [] }) }));
    expect(ids(noUsage)).toContain('no-community');

    expect(ids(evaluateApplication(facts()))).not.toContain('no-community');
  });

  it('mitigates no-community when a second admin is invited and the message is substantial', () => {
    const strongMessage = 'x'.repeat(250);
    const mitigated = evaluateApplication(
      facts({
        repository: repository({ commitStats: { totalCommits: 5, totalCommitters: 1 }, packages: [] }),
        teamSize: 2,
        message: strongMessage,
      }),
    );
    expect(flagById(mitigated, 'no-community')?.severity).toBe('warning');

    // Same project without the invited admin stays an error
    const unmitigated = evaluateApplication(
      facts({
        repository: repository({ commitStats: { totalCommits: 5, totalCommitters: 1 }, packages: [] }),
        teamSize: 1,
        message: strongMessage,
      }),
    );
    expect(flagById(unmitigated, 'no-community')?.severity).toBe('error');
  });

  it('flags weak projects on personal accounts, with the combined message when both apply', () => {
    const weakPersonal = evaluateApplication(
      facts({
        repository: repository({
          ownerKind: 'user',
          commitStats: { totalCommits: 5, totalCommitters: 1 },
          packages: [],
        }),
      }),
    );
    expect(ids(weakPersonal)).toContain('early-stage-personal-account');
    expect(ids(weakPersonal)).not.toContain('no-community');
    expect(ids(weakPersonal)).not.toContain('personal-account');

    // Personal account with 2 contributors and some usage: only the personal-account error
    const personal = evaluateApplication(
      facts({
        repository: repository({ ownerKind: 'user', commitStats: { totalCommits: 5, totalCommitters: 2 }, forks: 5 }),
      }),
    );
    expect(flagById(personal, 'personal-account')?.severity).toBe('error');
    expect(ids(personal)).not.toContain('early-stage-personal-account');

    // Strong project on a personal account: only the "convert to an org" warning
    const strongPersonal = evaluateApplication(
      facts({
        repository: repository({ ownerKind: 'user', commitStats: { totalCommits: 5, totalCommitters: 10 }, forks: 50 }),
      }),
    );
    expect(flagById(strongPersonal, 'personal-account-convert')?.severity).toBe('warning');
    expect(ids(strongPersonal)).not.toContain('personal-account');
    expect(ids(strongPersonal)).not.toContain('early-stage-personal-account');
    // The conversion warning is informational only: it has no confirmation checkbox
    expect(CONFIRMATION_MESSAGES['personal-account-convert']).toBeUndefined();
  });

  it('flags empty applications only once the applicant engaged with the text', () => {
    const empty = facts({ description: '', message: '' });
    expect(flagById(evaluateApplication(empty), 'empty-application')?.severity).toBe('error');
    expect(ids(evaluateApplication({ ...empty, applicationTextEngaged: false }))).not.toContain('empty-application');
  });

  it('blocks young, weak projects on both the early-stage and no-community errors', () => {
    const youngWeak = facts({
      teamSize: 1,
      repository: repository({
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        commitStats: { totalCommits: 5, totalCommitters: 1 },
        forks: 0,
        packages: [],
      }),
    });
    const flags = evaluateApplication(youngWeak);
    // Young + weak fires both the early-stage and no-community errors, neither can be bypassed
    expect(flagById(flags, 'early-stage')).toMatchObject({ severity: 'error' });
    expect(flagById(flags, 'no-community')).toMatchObject({ severity: 'error' });
    expect(getSubmissionGate(flags)).toMatchObject({
      canSubmit: false,
      hardBlocks: ['no-community', 'early-stage'],
      needsConfirmation: [],
    });
  });
});

describe('applicationRules - warnings', () => {
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  it('never blocks on repository availability gaps: non repository-shaped URLs are only a warning', () => {
    const flags = evaluateApplication(
      facts({ repositoryUrl: 'https://github.com', repository: null, repositoryInfoState: 'idle' }),
    );
    expect(flagById(flags, 'invalid-repository-url')?.severity).toBe('warning');
    expect(
      ids(
        evaluateApplication(
          facts({
            repositoryUrl: 'https://github.com',
            typeOfProject: 'COMMUNITY',
            repository: null,
            repositoryInfoState: 'idle',
          }),
        ),
      ),
    ).not.toContain('invalid-repository-url');
    expect(ids(evaluateApplication(facts()))).not.toContain('invalid-repository-url');
  });

  it('never blocks when the repository cannot be found or verified', () => {
    const flags = evaluateApplication(facts({ repositoryInfoState: 'not-found', repository: null }));
    expect(flagById(flags, 'repository-not-found')?.severity).toBe('warning');
    // Unknown/self-hosted hosts are only an info notice ("we will review manually")
    const selfHosted = evaluateApplication(
      facts({ repositoryUrl: 'https://git.mx-os.mx/org/repo', repositoryInfoState: 'not-found', repository: null }),
    );
    expect(flagById(selfHosted, 'unverified-repository')?.severity).toBe('info');
    expect(ids(selfHosted)).not.toContain('repository-not-found');
    // Nothing repository-based while the fetch is pending
    expect(ids(evaluateApplication(facts({ repositoryInfoState: 'pending', repository: null })))).not.toContain(
      'repository-not-found',
    );
    // Partial data is not evidence: repository-derived rules don't run without a found repository
    const partial = evaluateApplication(facts({ repositoryInfoState: 'not-found', repository: repository() }));
    expect(ids(partial)).not.toContain('no-community');
    expect(ids(partial)).not.toContain('license');
    expect(ids(partial)).not.toContain('early-stage');
  });

  it('warns about early stage, small community, inactivity, and a single admin', () => {
    const flags = evaluateApplication(
      facts({
        teamSize: 1,
        repository: repository({
          createdAt: daysAgo(30),
          lastCommitAt: daysAgo(120),
          commitStats: { totalCommits: 5, totalCommitters: 3 },
          forks: 3,
          packages: [],
        }),
      }),
    );
    expect(ids(flags)).toEqual(expect.arrayContaining(['early-stage', 'small-community', 'inactive', 'single-admin']));

    // Single-admin clears when an admin is invited
    expect(ids(evaluateApplication(facts({ teamSize: 2 })))).not.toContain('single-admin');
  });

  it('suppresses the inactive warning for projects with strong usage', () => {
    const inactive = facts({ repository: repository({ lastCommitAt: daysAgo(120), forks: 5, packages: [] }) });
    expect(ids(evaluateApplication(inactive))).toContain('inactive');
    const mature = facts({ repository: repository({ lastCommitAt: daysAgo(120), forks: 500, packages: [] }) });
    expect(ids(evaluateApplication(mature))).not.toContain('inactive');
  });

  it('warns when the application text is thin', () => {
    const flags = evaluateApplication(facts({ message: 'Hello' }));
    expect(ids(flags)).toContain('thin-application');
    expect(ids(evaluateApplication(facts({ message: 'Hello', applicationTextEngaged: false })))).not.toContain(
      'thin-application',
    );
  });

  it('warns for events and requires the copyright confirmation for copyright-sensitive projects', () => {
    expect(ids(evaluateApplication(facts({ typeOfProject: 'COMMUNITY' })))).toContain('events');
    expect(
      ids(evaluateApplication(facts({ typeOfProject: 'CODE', message: 'We organize an annual conference' }))),
    ).toContain('events');

    const copyright = evaluateApplication(facts({ name: 'Prysm - M3U IPTV player' }));
    expect(flagById(copyright, 'copyright')).toEqual({
      id: 'copyright',
      severity: 'warning',
      field: 'message',
      requiresConfirmation: true,
    });
    expect(ids(evaluateApplication(facts({ message: 'A torrent client for the masses', name: 'Foo' })))).toContain(
      'copyright',
    );
    expect(COPYRIGHT_KEYWORDS).toContain('iptv');
    expect(EVENT_KEYWORDS).toContain('meetup');
  });

  it('warns about missing or non open source licenses, archived repos, and forks', () => {
    expect(ids(evaluateApplication(facts({ repository: repository({ license: null }) })))).toContain('license');
    expect(ids(evaluateApplication(facts({ repository: repository({ license: 'CC-BY-NC-SA-4.0' }) })))).toContain(
      'license',
    );
    expect(ids(evaluateApplication(facts({ repository: repository({ license: 'NOASSERTION' }) })))).toContain(
      'license',
    );
    expect(ids(evaluateApplication(facts()))).not.toContain('license');
    expect(ids(evaluateApplication(facts({ repository: repository({ archived: true }) })))).toContain('archived');
    expect(ids(evaluateApplication(facts({ repository: repository({ isFork: true }) })))).toContain('fork');
  });

  it('anchors each rule to the form field it relates to', () => {
    const fieldOf = (overrides: Partial<ApplicationFacts>, id: RuleId) =>
      flagById(evaluateApplication(facts(overrides)), id)?.field;

    expect(fieldOf({ repository: repository({ archived: true }) }, 'archived')).toBe('repositoryUrl');
    expect(fieldOf({ repository: repository({ license: null }) }, 'license')).toBe('licenseSpdxId');
    expect(fieldOf({ typeOfProject: 'COMMUNITY' }, 'events')).toBe('typeOfProject');
    expect(fieldOf({ message: 'Hello' }, 'thin-application')).toBe('message');
    expect(fieldOf({ teamSize: 1 }, 'single-admin')).toBe('team');
    // "Tell us about your contributors and users in your application message" is anchored to the message field
    expect(
      fieldOf(
        { repository: repository({ commitStats: { totalCommits: 5, totalCommitters: 3 }, forks: 3, packages: [] }) },
        'small-community',
      ),
    ).toBe('message');
    // "…tell us about your community and your plans for the project" is anchored to the message field too
    expect(
      fieldOf(
        {
          repository: repository({
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            commitStats: { totalCommits: 5, totalCommitters: 3 },
            forks: 3,
            packages: [],
          }),
        },
        'early-stage',
      ),
    ).toBe('message');
    expect(
      fieldOf(
        { repository: repository({ commitStats: { totalCommits: 5, totalCommitters: 1 }, packages: [] }) },
        'no-community',
      ),
    ).toBe('repositoryUrl');
  });
});

// ─── Submission gate ─────────────────────────────────────────────────────────

describe('applicationRules - getSubmissionGate', () => {
  it('blocks submission on errors', () => {
    const hard: RuleFlag[] = [{ id: 'personal-account', severity: 'error' }];
    expect(getSubmissionGate(hard)).toMatchObject({ canSubmit: false, hardBlocks: ['personal-account'] });

    const errors: RuleFlag[] = [
      { id: 'no-community', severity: 'error' },
      { id: 'early-stage', severity: 'error' },
    ];
    expect(getSubmissionGate(errors)).toMatchObject({
      canSubmit: false,
      hardBlocks: ['no-community', 'early-stage'],
    });
  });

  it('blocks until required confirmations are ticked', () => {
    const copyright: RuleFlag[] = [{ id: 'copyright', severity: 'warning', requiresConfirmation: true }];
    expect(getSubmissionGate(copyright)).toMatchObject({ canSubmit: false, needsConfirmation: ['copyright'] });
    expect(getSubmissionGate(copyright, { confirmedRuleIds: ['copyright'] })).toMatchObject({ canSubmit: true });
  });

  it('allows submission when only plain warnings fire', () => {
    expect(getSubmissionGate([{ id: 'single-admin', severity: 'warning' }])).toMatchObject({ canSubmit: true });
    expect(getSubmissionGate([])).toMatchObject({ canSubmit: true });
  });
});

// ─── Host opt-out ───────────────────────────────────────────────────────────

describe('applicationRules - blockOnErrors host setting', () => {
  it('omits blocking rules when the host opted out', () => {
    const archived = facts({ repository: repository({ archived: true }) });

    const blocking = evaluateApplication(archived);
    expect(flagById(blocking, 'archived')?.severity).toBe('error');
    expect(getSubmissionGate(blocking)).toMatchObject({ canSubmit: false, hardBlocks: ['archived'] });

    const relaxed = evaluateApplication(archived, { blockOnErrors: false });
    expect(ids(relaxed)).not.toContain('archived');
    expect(getSubmissionGate(relaxed)).toMatchObject({ canSubmit: true, hardBlocks: [] });
  });

  it('still requires the copyright confirmation when the host opted out', () => {
    const flags = evaluateApplication(facts({ name: 'Prysm - M3U IPTV player' }), { blockOnErrors: false });
    expect(getSubmissionGate(flags)).toMatchObject({ canSubmit: false, needsConfirmation: ['copyright'] });
  });
});
