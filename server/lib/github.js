import config from 'config';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { get, has, pick } from 'lodash';

import cache from './cache';
import logger from './logger';

const compactRepo = repo => {
  repo = pick(repo, [
    'name', // (1)
    'full_name', // (1) (4)
    'description', // (1)
    'owner', // (1) (4)
    'stargazers_count', // (1) (2) (4)
    'topics', // (1)
    'fork', // (3)
  ]);
  repo.owner = pick(repo.owner, [
    'login', // (1)
    'type', // (4)
  ]);
  // 1) Required for the old website, according to:
  // https://github.com/opencollective/opencollective-website/blob/master/frontend/src/reducers/github.js
  // 2) Required for the pledge feature in /graphql/v1/orders.js
  // 3) Required for update-contributions
  // 4) Required on the frontend in the "GitHub flow" (OpenSourceApplyPage)
  return repo;
};

export function getOctokit(accessToken) {
  const octokitParams = {};

  octokitParams.previews = ['mercy-preview'];

  if (accessToken) {
    octokitParams.auth = `token ${accessToken}`;
  } else if (has(config, 'github.clientID') && has(config, 'github.clientSecret')) {
    octokitParams.authStrategy = createAppAuth;
    octokitParams.auth = {
      clientId: get(config, 'github.clientID'),
      clientSecret: get(config, 'github.clientSecret'),
    };
  }

  return Octokit(octokitParams);
}

export function getData(res) {
  if (has(res, ['headers', 'x-ratelimit-remaining'])) {
    logger.debug(`RateLimit Remaining: ${get(res, ['headers', 'x-ratelimit-remaining'])}`);
  }
  return res.data;
}

/**
 * Get all the public repos for which user is admin
 */
export async function getAllUserPublicRepos(accessToken) {
  const cacheKey = `user_repos_all_${accessToken}`;
  const fromCache = await cache.get(cacheKey);
  if (fromCache) {
    return fromCache;
  }

  const octokit = getOctokit(accessToken);

  const parameters = { page: 1, per_page: 100, visibility: 'public' };

  let repos = [];
  let fetchRepos;
  const maxNbPages = 15; // More than that would probably timeout the request
  do {
    // https://octokit.github.io/rest.js/#api-Repos-list
    // https://developer.github.com/v3/repos/#list-your-repositories
    fetchRepos = await octokit.repos.list(parameters).then(getData);
    repos = [...repos, ...fetchRepos.filter(r => r.permissions.admin)];
    parameters.page++;
  } while (fetchRepos.length === parameters.per_page && parameters.page < maxNbPages);

  if (parameters.page === maxNbPages) {
    logger.error(`Aborted: Too many repos to fetch for user with token ${accessToken}`);
  }

  repos = repos.map(compactRepo);

  cache.set(cacheKey, repos, 5 * 60 /* 5 minutes */);

  return repos;
}

export async function getAllOrganizationPublicRepos(org, accessToken) {
  const cacheKey = `org_repos_all_${org}`;
  const fromCache = await cache.get(cacheKey);
  if (fromCache) {
    return fromCache;
  }

  const octokit = getOctokit(accessToken);

  const parameters = { org, page: 1, per_page: 100, type: 'public' };

  let repos = [];
  let fetchRepos;
  do {
    // https://octokit.github.io/rest.js/#api-Repos-listForOrg
    // https://developer.github.com/v3/repos/#list-organization-repositories
    fetchRepos = await octokit.repos.listForOrg(parameters).then(getData);
    repos = [...repos, ...fetchRepos];
    parameters.page++;
  } while (fetchRepos.length === parameters.per_page);

  repos = repos.map(compactRepo);

  cache.set(cacheKey, repos, 5 * 60 /* 5 minutes */);

  return repos;
}

export async function getRepo(name, accessToken) {
  const octokit = getOctokit(accessToken);
  // https://octokit.github.io/rest.js/#api-Repos-get
  // https://developer.github.com/v3/repos/#get
  const [owner, repo] = name.split('/');
  return octokit.repos.get({ owner, repo }).then(getData);
}

export async function getOrg(name, accessToken) {
  const octokit = getOctokit(accessToken);
  // https://octokit.github.io/rest.js/#api-Orgs-get
  // https://developer.github.com/v3/orgs/#get-an-organization
  return octokit.orgs.get({ org: name }).then(getData);
}

export async function getOrgMemberships(accessToken) {
  const octokit = getOctokit(accessToken);
  // https://octokit.github.io/rest.js/#api-Orgs-listMemberships
  // https://developer.github.com/v3/orgs/members/#list-your-organization-memberships
  return octokit.orgs.listMemberships({ page: 1, per_page: 100 }).then(getData);
}

export async function handleOpenSourceAutomatedApproval(githubHandle, accessToken) {
  if (githubHandle.includes('/')) {
    // A repository GitHub Handle (most common)
    const repo = await getRepo(githubHandle, accessToken);
    const isGithubRepositoryAdmin = get(repo, 'permissions.admin') === true;
    if (!isGithubRepositoryAdmin) {
      throw new Error("We could not verify that you're admin of the GitHub repository");
    } else if (repo.stargazers_count < config.githubFlow.minNbStars) {
      throw new Error(
        `The repository need at least ${config.githubFlow.minNbStars} stars to apply to the Open Source Collective.`,
      );
    }
  } else {
    // An organization GitHub Handle
    const memberships = await getOrgMemberships(accessToken);
    const organizationAdminMembership =
      memberships &&
      memberships.find(m => m.organization.login === githubHandle && m.state === 'active' && m.role === 'admin');
    if (!organizationAdminMembership) {
      throw new Error("We could not verify that you're admin of the GitHub organization");
    }
    const allRepos = await getAllOrganizationPublicRepos(githubHandle).catch(() => null);
    const repoWith100stars = allRepos.find(repo => repo.stargazers_count >= config.githubFlow.minNbStars);
    if (!repoWith100stars) {
      throw new Error(
        `The organization need at least one repository with ${config.githubFlow.minNbStars} GitHub stars to be pledged.`,
      );
    }
  }
}
