#!/usr/bin/env node
import '../../server/env';

import { assign, get, isArray, pick } from 'lodash';

import models from '../../server/models';
import logger from '../../server/lib/logger';
import * as github from '../../server/lib/github';

const { Collective } = models;

// TODO: As number of collectives grow, we need to consider fetching 100 at a time,
// otherwise, we end up fetching a lot of data.
// Note: Picking attributes doesn't work with Histories table because Histories
// ends up recording on the attributes that were pulled out

const noContentToArray = value => (isArray(value) ? value : []);

const sortObjectByValue = (obj, path) => {
  const sortable = [];
  for (const key in obj) {
    sortable.push([key, obj[key], path ? get(obj[key], path) : obj[key]]);
  }

  sortable.sort((a, b) => {
    return a[2] > b[2] ? -1 : a[2] < b[2] ? 1 : 0;
  });

  const orderedList = {};
  for (let i = 0; i < sortable.length; i++) {
    orderedList[sortable[i][0]] = sortable[i][1];
  }

  return orderedList;
};

const getAllContributors = async repo => {
  const octokit = github.getOctokit();

  const fetchParameters = { page: 1, per_page: 100 };

  let repos = [];
  let fetchContributors;
  do {
    // https://octokit.github.io/rest.js/#api-Repos-listContributors
    // https://developer.github.com/v3/repos/#list-contributors
    fetchContributors = await octokit.repos
      .listContributors(repo, fetchParameters)
      .then(res => res.data)
      .then(noContentToArray)
      .then(repos => repos.map(repo => pick(repo, ['login', 'contributions'])));
    repos = [...repos, ...fetchContributors];
    fetchParameters.page++;
  } while (fetchContributors.length === fetchParameters.per_page);

  return repos;
};

const getRepoData = repo => {
  return getAllContributors(repo).then(contributors => {
    const contributorData = {};
    for (const contributor of contributors) {
      contributorData[contributor.login] = contributor.contributions;
    }
    return { contributorData };
  });
};

const getOrgData = org => {
  return github.getAllOrganizationPublicRepos(org).then(async repos => {
    const contributorData = [];
    const repoData = {};
    for (const repo of repos) {
      if (repo.fork) {
        continue;
      }
      const contributors = await getAllContributors({ owner: repo.owner.login, repo: repo.name });
      for (const contributor of contributors) {
        if (contributorData[contributor.login]) {
          contributorData[contributor.login] += contributor.contributions;
        } else {
          contributorData[contributor.login] = contributor.contributions;
        }
      }
      repoData[repo.name] = { stars: repo.stargazers_count };
    }
    return { contributorData, repoData };
  });
};

const run = async () => {
  let collectives = await Collective.findAll({
    where: {
      type: 'COLLECTIVE',
    },
  });

  logger.info(`Found ${collectives.length} total collective(s)`);

  collectives = collectives
    .filter(collective => get(collective, 'settings.githubOrg') || get(collective, 'settings.githubRepo'))
    .filter(collective => collective.isActive);

  logger.info(`Found ${collectives.length} active collective(s) with GitHub settings`);

  for (const collective of collectives) {
    const org = get(collective, 'settings.githubOrg');
    const repo = get(collective, 'settings.githubRepo');

    let githubData;

    if (org) {
      try {
        githubData = await getOrgData(org);
      } catch (e) {
        logger.error(`Error while fetching org data for collective '${collective.slug}'`);
        continue;
      }
    } else {
      const split = repo.split('/');
      if (split.length !== 2) {
        logger.warn(collective.name, 'Incorrect format of githubRepo');
        continue;
      }
      const options = {
        owner: split[0],
        repo: split[1],
      };
      try {
        githubData = await getRepoData(options);
      } catch (e) {
        logger.error(`Error while fetching ${options.owner}/${options.repo} for collective '${collective.slug}'`);
        continue;
      }
    }

    if (githubData) {
      const data = assign(collective.data || {}, {
        githubContributors: sortObjectByValue(githubData.contributorData),
      });

      if (githubData.repoData) {
        data.repos = sortObjectByValue(githubData.repoData, 'stars');
      }

      await collective.update({ data });

      logger.info(`Successfully updated contribution data for '${collective.name}'`);
    }
  }
};

run();
