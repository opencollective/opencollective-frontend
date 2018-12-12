import config from 'config';
import octokitRest from '@octokit/rest';
import request from 'request-promise';
import { pick } from 'lodash';

import cache from './cache';

const compactRepo = repo => {
  repo = pick(repo, [
    'name', // (1)
    'full_name', // (1)
    'description', // (1)
    'owner', // (1)
    'stargazers_count', // (1) (2)
    'topics', // (1)
  ]);
  repo.owner = pick(repo.owner, [
    'login', // (1)
  ]);
  // 1) Required for the old website, according to:
  // https://github.com/opencollective/opencollective-website/blob/master/frontend/src/reducers/github.js
  // 2) Required for the pledge feature in /graphql/v1/orders.js
  return repo;
};

export default function fetchUser(username) {
  return request({
    uri: `https://api.github.com/users/${username}`,
    qs: {
      client_id: config.github.clientID,
      client_secret: config.github.clientSecret,
    },
    headers: { 'User-Agent': 'OpenCollective' },
    json: true,
  });
}

export function getOctokit(accessToken) {
  const octokit = octokitRest({
    headers: {
      accept: 'application/vnd.github.mercy-preview+json',
    },
  });
  if (accessToken) {
    octokit.authenticate({ type: 'oauth', token: accessToken });
  }
  return octokit;
}

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
  do {
    // https://octokit.github.io/rest.js/#api-Repos-list
    // https://developer.github.com/v3/repos/#list-your-repositories
    fetchRepos = await octokit.repos.list(parameters).then(res => res.data);
    repos = [...repos, ...fetchRepos];
    parameters.page++;
  } while (fetchRepos.length === parameters.per_page);

  repos = repos.map(compactRepo);

  cache.set(cacheKey, repos, 5 * 60 /* 5 minutes */);

  return repos;
}

export async function getAllOrganizationPublicRepos(org, accessToken) {
  const cacheKey = `org_repos_all_${org}_${accessToken || ''}`;
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
    fetchRepos = await octokit.repos.listForOrg(parameters).then(res => res.data);
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
  return octokit.repos.get({ owner, repo }).then(res => res.data);
}

export async function getOrg(name, accessToken) {
  const octokit = getOctokit(accessToken);
  // https://octokit.github.io/rest.js/#api-Orgs-get
  // https://developer.github.com/v3/orgs/#get-an-organization
  return octokit.orgs.get({ org: name }).then(res => res.data);
}

export async function getOrgMemberships(accessToken) {
  const octokit = getOctokit(accessToken);
  // https://octokit.github.io/rest.js/#api-Orgs-listMemberships
  // https://developer.github.com/v3/orgs/members/#list-your-organization-memberships
  return octokit.orgs.listMemberships({ page: 1, per_page: 100 }).then(res => res.data);
}
