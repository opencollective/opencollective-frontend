/**
 * Client for the ecosyste.ms repository data proxied by our API
 * (`GET /api/ecosystems/repository?url=...`). The API replies with a
 * `EcosystemsRepoSummary` - the same structure as the POC in opencollective-tools
 * (`lib/ecosyste.ms.ts`), for a single repository URL.
 */

type RepoCommitStats = {
  total_commits: number;
  total_committers: number;
  last_synced_commit?: string | null;
};

type RepoMetadata = {
  full_name?: string;
  owner?: string | null;
  description: string | null;
  stargazers_count?: number;
  forks_count?: number;
  pushed_at?: string;
  created_at?: string;
  license: string | null;
  /** Repository topics (e.g. GitHub topics) */
  topics?: string[] | null;
  archived?: boolean;
  fork?: boolean;
  commit_stats?: RepoCommitStats;
};

type EcosystemsPackage = {
  name: string;
  ecosystem: string;
  maintainers?: { login?: string | null; name?: string | null }[] | null;
  dependent_packages_count?: number;
  dependent_repos_count?: number;
  first_release_published_at?: string | null;
  latest_release_published_at?: string | null;
  /** Repository metadata attached to the package by ecosyste.ms */
  repo_metadata?: { commit_stats?: RepoCommitStats } | null;
};

type EcosystemsCommitsRepository = {
  status?: string | null;
  full_name?: string;
  total_commits?: number;
  total_committers?: number;
  total_bot_committers?: number;
  past_year_total_committers?: number;
  past_year_total_bot_committers?: number;
};

type EcosystemsIssuesRepository = {
  status?: string | null;
  full_name?: string;
  issues_count?: number;
  pull_requests_count?: number;
};

type EcosystemsOwner = {
  login?: string;
  kind?: string;
  name?: string | null;
};

/** The structure replied by our API for a single repository, as in the opencollective-tools POC */
export type EcosystemsRepoSummary = {
  packages: EcosystemsPackage[];
  repository: RepoMetadata | null;
  contributors: EcosystemsCommitsRepository | null;
  issues: EcosystemsIssuesRepository | null;
  owner: EcosystemsOwner | null;
};

/** Compact projection of a `EcosystemsRepoSummary`, stored as `applicationData.ecosystemsRepositoryInfo` */
export type EcosystemsRepositorySnapshot = {
  fullName: string | null;
  owner: string | null;
  description: string | null;
  stars: number | null;
  forks: number | null;
  isFork: boolean | null;
  license: string | null;
  /** Repository topics (e.g. GitHub topics) */
  topics: string[];
  /** Owner kind as reported by ecosyste.ms (`user` for personal accounts, `organization`) */
  ownerKind: string | null;
  archived: boolean | null;
  /** Repository creation date */
  createdAt: string | null;
  /** Date of the last commit/push activity */
  lastCommitAt: string | null;
  lastCommitSha: string | null;
  commitStats: {
    totalCommits: number;
    /** Human committers only, bot accounts are reported separately */
    totalCommitters: number;
    /** Bot committers reported by the commits API, when available */
    botCommitters?: number;
  } | null;
  packages: Array<{
    name: string;
    ecosystem: string;
    maintainers: Array<{ login: string | null; name: string | null }>;
    /** Number of packages depending on this package */
    dependentPackagesCount: number | null;
    /** Number of repositories depending on this package */
    dependentReposCount: number | null;
    firstReleasePublishedAt: string | null;
    latestReleasePublishedAt: string | null;
  }>;
};

export async function fetchEcosystemsRepositoryInfo(repositoryUrl: string): Promise<EcosystemsRepoSummary> {
  const response = await fetch(`/api/ecosystems/repository?url=${encodeURIComponent(repositoryUrl)}`);
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.error?.message || `Failed to fetch the repository information (${response.status})`);
  }
  return json;
}

/** Human committers across every ecosyste.ms source (the repository record, the package metadata
 * and the commits API, minus the bots it reports separately). Mirrors `maxHumanCommitters` in
 * `opencollective-tools/osc/application-rules.ts`. */
function maxHumanCommitters(entry: EcosystemsRepoSummary): number | null {
  const counts = [entry.repository?.commit_stats?.total_committers];

  for (const pkg of entry.packages || []) {
    counts.push(pkg.repo_metadata?.commit_stats?.total_committers);
  }

  if (entry.contributors) {
    if (typeof entry.contributors.total_committers === 'number') {
      counts.push(entry.contributors.total_committers - (entry.contributors.total_bot_committers || 0));
    }
    if (typeof entry.contributors.past_year_total_committers === 'number') {
      counts.push(
        entry.contributors.past_year_total_committers - (entry.contributors.past_year_total_bot_committers || 0),
      );
    }
  }

  const valid = counts.filter((count): count is number => typeof count === 'number');
  return valid.length > 0 ? Math.max(...valid) : null;
}

export function toRepositorySnapshot(entry: EcosystemsRepoSummary): EcosystemsRepositorySnapshot {
  const repository = entry.repository;
  const totalCommitters = maxHumanCommitters(entry);
  const botCommitters = entry.contributors?.total_bot_committers;
  const hasCommitStats = totalCommitters !== null || typeof botCommitters === 'number';

  return {
    fullName: repository?.full_name ?? null,
    owner: repository?.owner ?? null,
    description: repository?.description ?? null,
    stars: repository?.stargazers_count ?? null,
    forks: repository?.forks_count ?? null,
    isFork: repository?.fork ?? null,
    license: repository?.license ?? null,
    topics: repository?.topics ?? [],
    ownerKind: entry.owner?.kind ?? null,
    archived: repository?.archived ?? null,
    createdAt: repository?.created_at ?? null,
    lastCommitAt: repository?.pushed_at ?? null,
    lastCommitSha: repository?.commit_stats?.last_synced_commit ?? null,
    commitStats: hasCommitStats
      ? {
          totalCommits: repository?.commit_stats?.total_commits ?? 0,
          totalCommitters: totalCommitters ?? 0,
          ...(typeof botCommitters === 'number' && { botCommitters }),
        }
      : null,
    packages: (entry.packages || []).map(pkg => ({
      name: pkg.name,
      ecosystem: pkg.ecosystem,
      maintainers: (pkg.maintainers || []).map(maintainer => ({
        login: maintainer.login ?? null,
        name: maintainer.name ?? null,
      })),
      dependentPackagesCount: pkg.dependent_packages_count ?? null,
      dependentReposCount: pkg.dependent_repos_count ?? null,
      firstReleasePublishedAt: pkg.first_release_published_at ?? null,
      latestReleasePublishedAt: pkg.latest_release_published_at ?? null,
    })),
  };
}
