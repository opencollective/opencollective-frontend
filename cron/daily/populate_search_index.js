#!/usr/bin/env node
import '../../server/env';

import Promise from 'bluebird';
import debugLib from 'debug';
import { Op } from 'sequelize';

import algolia from '../../server/lib/algolia';
import emailLib from '../../server/lib/email';
import models from '../../server/models';
import { chunkArray } from '../../server/lib/utils';
import { types as collectiveTypes } from '../../server/constants/collectives';

const debug = debugLib('populate_search_index');

const chunkSize = 10; // number of collectives to send at once

const done = error => {
  if (error) {
    debug('Error in updating index', error);

    return emailLib
      .sendMessage('ops@opencollective.com', 'Error in updating index', '', {
        bcc: ' ',
        text: error,
      })
      .then(process.exit)
      .catch(console.error);
  }

  debug('Finished updating search records');
  process.exit();
};

const populateIndex = async () => {
  const collectives = await models.Collective.findAll({
    where: {
      type: {
        [Op.or]: [collectiveTypes.COLLECTIVE, collectiveTypes.ORGANIZATION],
      },
      id: {
        [Op.notIn]: [1, 7],
      },
      isActive: true,
      deactivatedAt: {
        [Op.is]: null,
      },
    },

    attributes: {
      exclude: ['settings', 'data', 'longDescription'],
    }, // exclude json fields to not fetch a lot of data
    order: ['id'],
  });
  debug(`Collectives found: ${collectives.length}`);

  /*
    TODO: process data
    - remove repeating words like 'we are on a mission'
    - include events (currently not included because no way to redirect directly to the event without parentCollective info). Might be easiest to include a publicUrl in the metadata
  */

  const searchData = await Promise.map(collectives, async collective => {
    const [backersCount, balance, yearlyBudget] = await Promise.all([
      collective.getBackersCount(),
      collective.getBalance(),
      collective.getYearlyIncome(),
    ]);

    return {
      ...collective.searchIndex,
      backersCount,
      balance,
      yearlyBudget,
      objectID: collective.id,
    };
  });

  const index = algolia.getIndex();

  // we need to send these in batches, there is a limit of 18kb per request
  const chunkedData = chunkArray(searchData, chunkSize);

  const indexedCount = await Promise.reduce(
    chunkedData,
    async (total, chunk) => {
      await index.addObjects(chunk);
      return total + chunk.length;
    },
    0,
  );
  debug(`Total collectives indexed: ${indexedCount}`);
};

const run = () => {
  debug('Starting job to populate index on Algolia');
  return populateIndex()
    .then(() => done())
    .catch(done);
};

run();
