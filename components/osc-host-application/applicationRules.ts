/**
 * Eligibility rules for the OSC host application form.
 *
 * Pure, dependency-light validation logic shared by the application form (warnings +
 * blocking errors before submission) and, later, the host review tools: rules are
 * calibrated on the October 2026 application review (see `application_rules.md`) and
 * each rule maps to one of the canned responses in `email_templates.md`.
 */

import { defineMessages, type MessageDescriptor } from 'react-intl';
import spdxLicenses from 'spdx-license-list';

import type { EcosystemsRepositorySnapshot } from '../../lib/ecosystems';

// ─── Facts ───────────────────────────────────────────────────────────────────

/** State of the ecosyste.ms lookup for the repository URL entered in the form */
type RepositoryInfoState =
  /** No (or invalid) repository URL */
  | 'idle'
  /** Fetching (debounce in progress or request in flight) */
  | 'pending'
  /** A repository record was found */
  | 'found'
  /** The lookup succeeded but returned no repository record */
  | 'not-found'
  /** The lookup failed (network, rate limit...) */
  | 'error';

export type ApplicationFacts = {
  typeOfProject?: string | null;
  repositoryUrl?: string | null;
  /** Collective name (used by the keyword rules) */
  name?: string | null;
  message?: string | null;
  description?: string | null;
  /** 1 + invited admins */
  teamSize?: number | null;
  /** False while the applicant has not engaged with the application text (or attempted to submit) */
  applicationTextEngaged?: boolean;
  repositoryInfoState: RepositoryInfoState;
  /** The compact ecosyste.ms snapshot fetched for the repository URL, if any */
  repository?: EcosystemsRepositorySnapshot | null;
};

// ─── Flags ───────────────────────────────────────────────────────────────────

export type RuleId =
  | 'invalid-repository-url'
  | 'repository-not-found'
  | 'no-community'
  | 'personal-account'
  | 'early-stage-personal-account'
  | 'empty-application'
  | 'personal-account-convert'
  | 'early-stage'
  | 'small-community'
  | 'inactive'
  | 'single-admin'
  | 'thin-application'
  | 'events'
  | 'copyright'
  | 'license'
  | 'archived'
  | 'fork'
  | 'unverified-repository';

type RuleSeverity = 'error' | 'warning' | 'info';

/** The form field a rule relates to: warnings are displayed next to it */
type RuleField = 'repositoryUrl' | 'licenseSpdxId' | 'typeOfProject' | 'message' | 'team';

const RULE_FIELDS: Record<RuleId, RuleField> = {
  'invalid-repository-url': 'repositoryUrl',
  'repository-not-found': 'repositoryUrl',
  'no-community': 'repositoryUrl',
  'personal-account': 'repositoryUrl',
  'early-stage-personal-account': 'repositoryUrl',
  'empty-application': 'message',
  'personal-account-convert': 'repositoryUrl',
  'early-stage': 'message',
  'small-community': 'message',
  inactive: 'repositoryUrl',
  'single-admin': 'team',
  'thin-application': 'message',
  events: 'typeOfProject',
  copyright: 'message',
  license: 'licenseSpdxId',
  archived: 'repositoryUrl',
  fork: 'repositoryUrl',
  'unverified-repository': 'repositoryUrl',
};

export type RuleFlag = {
  id: RuleId;
  severity: RuleSeverity;
  /** The form field the rule relates to, so warnings can be displayed next to it */
  field?: RuleField;
  /** Warnings that require an explicit confirmation before submitting */
  requiresConfirmation?: boolean;
};

type SubmissionGate = {
  canSubmit: boolean;
  /** Errors block submission */
  hardBlocks: RuleId[];
  /** Rules waiting for their confirmation checkbox */
  needsConfirmation: RuleId[];
};

const RULES_CONFIG = {
  /** Below this, the application text counts as empty */
  MESSAGE_EMPTY_LENGTH: 20,
  /** Below this, the application text counts as thin */
  MESSAGE_THIN_LENGTH: 100,
  /** From this, the application text counts as substantial (mitigation input) */
  MESSAGE_SUBSTANTIAL_LENGTH: 200,
  /** Projects younger than this are "early stage" */
  EARLY_STAGE_MONTHS: 3,
  /** Without activity for this long, a repository is inactive */
  INACTIVE_MONTHS: 3,
  /** From this usage level, mature-but-quiet projects are not flagged as inactive */
  STRONG_USAGE: 25,
} as const;

/** Lower-cased keywords that call for the copyrighted-material guarantee before approval */
export const COPYRIGHT_KEYWORDS = [
  'iptv',
  'm3u',
  'torrent',
  'anime',
  'manga',
  'netflix',
  'spotify',
  'crunchyroll',
  'free movies',
  'watch movies',
  'watch series',
  'movie streaming',
  'live tv',
  'live sports',
  'ppv',
  'drm',
  'piracy',
  'cracked',
  'kodi',
  'stremio',
  'emby',
  'jellyfin',
  'usenet',
  'nzb',
];

/** Lower-cased keywords for projects that host in-person events */
export const EVENT_KEYWORDS = [
  'conference',
  'conferences',
  'meetup',
  'meetups',
  'summit',
  'hackathon',
  'workshop',
  'in-person',
];

export const RULE_MESSAGES: Record<RuleId, MessageDescriptor> = defineMessages({
  'invalid-repository-url': {
    id: 'HostApplication.rules.invalidRepositoryUrl',
    defaultMessage:
      'Please link directly to your source code repository (for example https://github.com/your-org/your-repository).',
  },
  'repository-not-found': {
    id: 'HostApplication.rules.repositoryNotFound',
    defaultMessage: "We couldn't find this repository. It must exist and be public for us to review it.",
  },
  'no-community': {
    id: 'HostApplication.rules.noCommunity',
    defaultMessage:
      "OSC's fiscal hosting is designed for community-driven projects with active collaboration. Your project currently shows a single contributor or no usage yet (forks or dependents). New and early-stage projects often find that fiscal hosting adds more overhead than needed at this stage — platforms like Ko-Fi, Patreon, or Buy Me a Coffee can be a better fit. You are welcome to reapply as your project grows.",
  },
  'personal-account': {
    id: 'HostApplication.rules.personalAccount',
    defaultMessage:
      'Projects must be hosted under an organizational account rather than a personal one. Your project also shows early-stage signals (few contributors or little usage), so we are not able to accept it at this time — you are welcome to reapply as it grows.',
  },
  'early-stage-personal-account': {
    id: 'HostApplication.rules.earlyStagePersonalAccount',
    defaultMessage:
      "We're not able to accept your project at this time. OSC's fiscal hosting program is designed for community-driven projects with active collaboration, and your project appears to still be in earlier stages or without the level of community involvement needed. Additionally, your project is currently hosted under a personal account: we only accept projects hosted under organizational accounts. New and early-stage projects often discover that fiscal hosting adds more administrative overhead than needed at this stage. As your project grows and more contributors get involved, you're welcome to reapply.",
  },
  'empty-application': {
    id: 'HostApplication.rules.emptyApplication',
    defaultMessage:
      "We don't have enough information to review this application: please describe your project and tell us about it in your application message.",
  },
  'personal-account-convert': {
    id: 'HostApplication.rules.personalAccountConvert',
    defaultMessage:
      'Your project is hosted under a personal account. We only accept projects under organizational accounts.',
  },
  'early-stage': {
    id: 'HostApplication.rules.earlyStage',
    defaultMessage:
      'Your project appears to be in earlier stages. Our fiscal hosting program is designed for community-driven projects with active collaboration — tell us about your community and your plans for the project.',
  },
  'small-community': {
    id: 'HostApplication.rules.smallCommunity',
    defaultMessage:
      'Your project shows a small community or limited usage so far. Tell us about your contributors and users in your application message.',
  },
  inactive: {
    id: 'HostApplication.rules.inactive',
    defaultMessage:
      "This repository hasn't shown recent activity. Our fiscal hosting is designed for projects that are currently active or have significant ongoing usage.",
  },
  'single-admin': {
    id: 'HostApplication.rules.singleAdmin',
    defaultMessage:
      'We recommend adding at least one more admin to your Collective: shared responsibility is part of what we look for.',
  },
  'thin-application': {
    id: 'HostApplication.rules.thinApplication',
    defaultMessage:
      'Please tell us more about your project below: we need enough information to determine whether it is a good fit.',
  },
  events: {
    id: 'HostApplication.rules.events',
    defaultMessage:
      'Projects that host in-person events must have a code of conduct they can consistently implement. Note that we do not provide event insurance as part of our program.',
  },
  copyright: {
    id: 'HostApplication.rules.copyright',
    defaultMessage:
      'If your project provides access to resources that may be copyrighted, we need a guarantee that it does not and will not provide direct access to copyrighted material without the express permission of the copyright holder. Note that this does not stop you from building tooling that provides access to resources that are user inputted into the application.',
  },
  license: {
    id: 'HostApplication.rules.license',
    defaultMessage:
      "We couldn't find a recognized open source license for this repository. Open source projects must be published under an open source license.",
  },
  archived: {
    id: 'HostApplication.rules.archived',
    defaultMessage: 'This repository is archived: is your project still active?',
  },
  fork: {
    id: 'HostApplication.rules.fork',
    defaultMessage:
      'This repository is a fork of another project: tell us what is different about yours and who is behind it.',
  },
  'unverified-repository': {
    id: 'HostApplication.rules.unverifiedRepository',
    defaultMessage:
      "We couldn't fetch information about this repository automatically. Our team will review it manually.",
  },
});

export const CONFIRMATION_MESSAGES: Partial<Record<RuleId, MessageDescriptor>> = defineMessages({
  copyright: {
    id: 'HostApplication.rules.copyright.confirmation',
    defaultMessage:
      'I confirm that this project does not and will not provide direct access to copyrighted material without the express permission of the copyright holder.',
  },
});

// ─── Derived metrics ─────────────────────────────────────────────────────────

/** Human contributors: the largest of the committer and package-maintainer counts */
export function getContributors(repository?: EcosystemsRepositorySnapshot | null): number | null {
  const counts = [
    repository?.commitStats?.totalCommitters,
    ...(repository?.packages || []).map(pkg => pkg.maintainers.length),
  ].filter((count): count is number => typeof count === 'number');
  return counts.length > 0 ? Math.max(...counts) : null;
}

/** Traction: the largest of forks and the package dependent counts */
export function getUsage(repository?: EcosystemsRepositorySnapshot | null): number | null {
  if (!repository) {
    return null;
  }
  const counts = [];
  if (typeof repository.forks === 'number') {
    counts.push(repository.forks);
  }
  if (repository.packages.length > 0) {
    counts.push(repository.packages.reduce((sum, pkg) => sum + (pkg.dependentReposCount || 0), 0));
    counts.push(repository.packages.reduce((sum, pkg) => sum + (pkg.dependentPackagesCount || 0), 0));
  }
  return counts.length > 0 ? Math.max(...counts) : null;
}

/** Project age in months, from the oldest of the repository creation and the first package release */
export function getProjectAgeInMonths(
  repository?: EcosystemsRepositorySnapshot | null,
  now: number = Date.now(),
): number | null {
  const timestamps = [repository?.createdAt, ...(repository?.packages || []).map(pkg => pkg.firstReleasePublishedAt)]
    .map(value => (value ? new Date(value).getTime() : NaN))
    .filter(time => !isNaN(time));
  if (timestamps.length === 0) {
    return null;
  }
  return Math.round(((now - Math.min(...timestamps)) / (30 * 24 * 60 * 60 * 1000)) * 10) / 10;
}

// ─── URL and license helpers ─────────────────────────────────────────────────

const KNOWN_GIT_HOSTS = ['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org', 'gitea.com'];

function parseUrl(url?: string | null): URL | null {
  try {
    const parsed = new URL((url || '').trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null;
  } catch {
    return null;
  }
}

/** True when the URL points at a repository (host + owner + repository path) */
export function isRepositoryUrl(url?: string | null): boolean {
  const parsed = parseUrl(url);
  if (!parsed) {
    return false;
  }
  return parsed.pathname.split('/').filter(Boolean).length >= 2;
}

/** True for the git hosts ecosyste.ms can look up (self-hosted forges cannot be verified) */
export function isKnownGitHost(url?: string | null): boolean {
  const parsed = parseUrl(url);
  return Boolean(parsed && KNOWN_GIT_HOSTS.includes(parsed.host.replace(/^www\./, '').toLowerCase()));
}

const SPDX_LICENSE_ID_BY_LOWER_ID = Object.fromEntries(Object.keys(spdxLicenses).map(id => [id.toLowerCase(), id]));

/** Maps the license identifier reported by the repository host (e.g. `mit`) to the SPDX id used by the license select (e.g. `MIT`) */
export function toSpdxLicenseId(license?: string | null): string | null {
  return SPDX_LICENSE_ID_BY_LOWER_ID[(license || '').trim().toLowerCase()] || null;
}

/** True when the repository license is a recognized (OSI approved) open source license */
export function isOpenSourceLicense(license?: string | null): boolean {
  const spdxId = toSpdxLicenseId(license);
  return Boolean(spdxId && spdxLicenses[spdxId]?.osiApproved);
}

// ─── Rules ───────────────────────────────────────────────────────────────────

const containsKeyword = (text: string, keywords: string[]): boolean => {
  const lowerCased = text.toLowerCase();
  return keywords.some(keyword => lowerCased.includes(keyword));
};

/**
 * Evaluates the application against all rules. Returns the flags to display - empty
 * when the application raises no issue.
 */
export function evaluateApplication(facts: ApplicationFacts): RuleFlag[] {
  const flags: RuleFlag[] = [];
  const url = (facts.repositoryUrl || '').trim();
  const name = facts.name || '';
  const message = facts.message || '';
  const description = (facts.description || '').trim();
  const teamSize = Math.max(1, facts.teamSize ?? 1);
  const state = facts.repositoryInfoState;
  // Repository-derived rules only run on a repository we actually found: a lookup gap is
  // never evidence against the project (and never blocks - user decision)
  const repository = state === 'found' ? (facts.repository ?? null) : null;

  const contributors = repository ? getContributors(repository) : null;
  const usage = repository ? getUsage(repository) : null;
  const ageInMonths = repository ? getProjectAgeInMonths(repository) : null;

  // Repository URL shape (typed URLs only: broken URLs are caught by the field validation).
  // Repository availability is never blocking: we warn and let the reviewers follow up.
  if (facts.typeOfProject === 'CODE' && parseUrl(url) && !isRepositoryUrl(url)) {
    flags.push({ id: 'invalid-repository-url', severity: 'warning' });
  }

  // Repository lookup results
  if (state === 'not-found') {
    if (isKnownGitHost(url)) {
      flags.push({ id: 'repository-not-found', severity: 'warning' });
    } else {
      flags.push({ id: 'unverified-repository', severity: 'info' });
    }
  } else if (state === 'error') {
    flags.push({ id: 'unverified-repository', severity: 'info' });
  }

  // Application text (only once the applicant engaged with it, to avoid scolding an empty form)
  if (facts.applicationTextEngaged) {
    if (!description && message.trim().length < RULES_CONFIG.MESSAGE_EMPTY_LENGTH) {
      flags.push({ id: 'empty-application', severity: 'error' });
    } else if (message.trim().length < RULES_CONFIG.MESSAGE_THIN_LENGTH) {
      flags.push({ id: 'thin-application', severity: 'warning' });
    }
  }

  // Community and traction
  const noCommunity = (contributors !== null && contributors <= 1) || (usage !== null && usage === 0);
  const weak = (contributors !== null && contributors <= 2) || (usage !== null && usage <= 1);
  const onPersonalAccount = repository?.ownerKind === 'user';
  // "Pending second admin" case: the applicant addressed the community concern in the form
  const communityMitigated = teamSize >= 2 && message.trim().length >= RULES_CONFIG.MESSAGE_SUBSTANTIAL_LENGTH;

  if (noCommunity && onPersonalAccount && weak && !communityMitigated) {
    flags.push({ id: 'early-stage-personal-account', severity: 'error' });
  } else {
    if (noCommunity) {
      flags.push(
        communityMitigated ? { id: 'no-community', severity: 'warning' } : { id: 'no-community', severity: 'error' },
      );
    }
    if (onPersonalAccount && weak) {
      flags.push({ id: 'personal-account', severity: 'error' });
    } else if (onPersonalAccount) {
      flags.push({ id: 'personal-account-convert', severity: 'warning' });
    }
    if (!noCommunity && ((contributors !== null && contributors <= 4) || (usage !== null && usage <= 4))) {
      flags.push({ id: 'small-community', severity: 'warning' });
    }
  }

  if (ageInMonths !== null && ageInMonths < RULES_CONFIG.EARLY_STAGE_MONTHS && weak) {
    flags.push({ id: 'early-stage', severity: 'error' });
  } else if (ageInMonths !== null && ageInMonths < RULES_CONFIG.EARLY_STAGE_MONTHS) {
    flags.push({ id: 'early-stage', severity: 'warning' });
  }

  if (teamSize <= 1) {
    flags.push({ id: 'single-admin', severity: 'warning' });
  }

  if (repository?.lastCommitAt) {
    const lastCommitAt = Date.parse(repository.lastCommitAt);
    const inactiveForMonths = (Date.now() - lastCommitAt) / (30 * 24 * 60 * 60 * 1000);
    const stronglyUsed = usage !== null && usage >= RULES_CONFIG.STRONG_USAGE;
    if (!isNaN(inactiveForMonths) && inactiveForMonths > RULES_CONFIG.INACTIVE_MONTHS && !stronglyUsed) {
      flags.push({ id: 'inactive', severity: 'error' });
    }
  }

  const keywordText = `${name} ${message} ${(repository?.topics || []).join(' ')}`;
  if (containsKeyword(keywordText, COPYRIGHT_KEYWORDS)) {
    flags.push({ id: 'copyright', severity: 'warning', requiresConfirmation: true });
  }

  if (facts.typeOfProject === 'COMMUNITY' || containsKeyword(`${name} ${message}`, EVENT_KEYWORDS)) {
    flags.push({ id: 'events', severity: 'warning' });
  }

  if (repository && !isOpenSourceLicense(repository.license)) {
    flags.push({ id: 'license', severity: 'warning' });
  }

  if (repository?.archived) {
    flags.push({ id: 'archived', severity: 'error' });
  }

  if (repository?.isFork) {
    flags.push({ id: 'fork', severity: 'warning' });
  }

  return flags.map(flag => ({ ...flag, field: RULE_FIELDS[flag.id] }));
}

/**
 * Aggregates the flags into a submission gate: errors block submission, confirmations block
 * until ticked. (The "submit for manual review anyway" escape hatch was removed for now.)
 */
export function getSubmissionGate(
  flags: RuleFlag[],
  { confirmedRuleIds = [] }: { confirmedRuleIds?: string[] } = {},
): SubmissionGate {
  const hardBlocks = flags.filter(flag => flag.severity === 'error').map(flag => flag.id);
  const needsConfirmation = flags
    .filter(flag => flag.requiresConfirmation && !confirmedRuleIds.includes(flag.id))
    .map(flag => flag.id);

  return {
    canSubmit: hardBlocks.length === 0 && needsConfirmation.length === 0,
    hardBlocks,
    needsConfirmation,
  };
}
