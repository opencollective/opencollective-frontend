#!/usr/bin/env node

'use strict';

require('bluebird')
  .longStackTraces();

const app = require('../index');
const GitHubClient = require('opencollective-jobs').GitHubClient;
const Group = app.set('models').Group;
const _ = require('lodash');

const client = GitHubClient({logLevel: 'verbose'});
const log = client.log; // repurpose the logger

Group.findAll({
  attributes: [
    'id',
    'name',
    'settings'
  ]
})
  .tap(groups => {
    log.verbose('groups', `Found ${groups.length} group(s) to inspect`);
  })
  .each(group => {
    const org = _.get(group, 'settings.githubOrg');
    if (!org) {
      log.warn(group.name, `GitHub org not associated`);
      return;
    }
    return client.contributorsInOrg({orgs: [org]})
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
        return data;
      })
      .then(data => {
        group.settings = _.assign(group.settings || {}, {
          githubOrg: org
        });
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
