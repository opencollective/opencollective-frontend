#!/usr/bin/env node
import Promise from 'bluebird';
import { GitHubClient } from 'opencollective-jobs';
import models from '../../server/models';
const _ = require('lodash'); //eslint-disable-line import/no-commonjs

Promise.longStackTraces();
const client = GitHubClient({logLevel: 'verbose'});
const { log } = client; // repurpose the logger
const { Collective } = models;

Collective.findAll({
  attributes: [
    'id',
    'name',
    'settings',
    'data'
  ], 
  where: {
    type: "COLLECTIVE"
  }
})
  .tap(collectives => {
    log.verbose('collectives', `Found ${collectives.length} collective(s) to inspect`);
  })
  .each(collective => {
    const org = _.get(collective, 'settings.githubOrg');
    const repoLink = _.get(collective, 'settings.githubRepo');
    if (!org && !repoLink) {
      log.warn(collective.name, `No GitHub org or repo associated`);
      return;
    }
    let fetchPromise;

    if (org) {
      fetchPromise = client.contributorsInOrg({orgs: [org]})
        .get(org)
        .then(repos => {
          const data = {};
          data.contributorData = _(repos)
              .map('contributors')
              .reduce((acc, contributions) => {
                _.each(contributions, (count, user) => {
                  acc[user] = (acc[user] || 0) + count;
                });
                return acc;
              }, {});
          data.repoData = _.mapValues(repos, repo => _.omit(repo, 'contributors'));
          data.stars = _(repos)
              .map('stars')
              .reduce((sum, n) => {
                return sum + n;
              }, 0)
          return data;
        });
    } else {
      const split = repoLink.split('/');
      if (split.length !== 2) {
        log.warn(collective.name, 'Incorrect format of githubRepo');
        return;
      }
      const options = {
        user: split[0],
        repo: split[1]
      }
      fetchPromise = client.contributorsForRepo(options)
        .then(data => {
          const contributorData = {};
          data.map(dataEntry => contributorData[dataEntry.user] = dataEntry.contributions);
          return {contributorData}
        });
    }

    return fetchPromise
      .then(data => {
        collective.data = _.assign(collective.data || {}, {
          githubContributors: data.contributorData,
          repos: data.repoData
        });
        return collective.save();
      })
      .then(() => {
        log.info(collective.name,
          `Successfully updated contribution data`);
      })
      .catch(err => {
        log.error(collective.name, err.stack);
      });
  })
  .finally(() => {
    log.verbose('collectives', 'Done.');
    process.exit();
  });
