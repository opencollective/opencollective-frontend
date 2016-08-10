#!/usr/bin/env node

'use strict';

require('bluebird')
  .longStackTraces();

const app = require('../../index');
const GitHubClient = require('opencollective-jobs').GitHubClient;
const Group = app.set('models').Group;
const _ = require('lodash');

const client = GitHubClient({logLevel: 'verbose'});
const log = client.log; // repurpose the logger

Group.findAll({
  attributes: [
    'id',
    'name',
    'settings',
    'data'
  ]
})
  .tap(groups => {
    log.verbose('groups', `Found ${groups.length} group(s) to inspect`);
  })
  .each(group => {
    const org = _.get(group, 'settings.githubOrg');
    const repoLink = _.get(group, 'settings.githubRepo');
    if (!org && !repoLink) {
      log.warn(group.name, `No GitHub org or repo associated`);
      return;
    }
    var fetchPromise;

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
      if (split.length != 2) {
        log.warn(group.name, 'Incorrect format of githubRepo');
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
        group.data = _.assign(group.data || {}, {
          githubContributors: data.contributorData,
          repos: data.repoData
        });
        return group.save();
      })
      .then(() => {
        log.info(group.name,
          `Successfully updated contribution data`);
      })
      .catch(err => {
        log.error(group.name, err.stack);
      });
  })
  .finally(() => {
    log.verbose('groups', 'Done.');
    process.exit();
  });
