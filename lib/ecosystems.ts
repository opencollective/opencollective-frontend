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
};

type EcosystemsCommitsRepository = {
  status?: string | null;
  full_name?: string;
  total_commits?: number;
  total_committers?: number;
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
  commitStats: { totalCommits: number; totalCommitters: number } | null;
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

export function toRepositorySnapshot(entry: EcosystemsRepoSummary): EcosystemsRepositorySnapshot {
  const repository = entry.repository;
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
    commitStats: repository?.commit_stats
      ? {
          totalCommits: repository.commit_stats.total_commits,
          totalCommitters: repository.commit_stats.total_committers,
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
