import config from 'config';
import algoliasearch from 'algoliasearch';
import Promise from 'bluebird';
import { Op } from 'sequelize';

import models from '../../server/models';
import { types as collectiveTypes } from '../../server/constants/collectives';
import { chunkArray } from '../../server/lib/utils';
import emailLib from '../../server/lib/email';
import debugLib from 'debug';

const debug = debugLib('populate_search_index');

const {
  appId: ALGOLIA_APP_ID,
  appKey: ALGOLIA_KEY,
  index: ALGOLIA_INDEX,
} = config.algolia;
const chunkSize = 10; // number of collectives to send at once


const done = (error) => {
  if (error) {
    debug('Error in updating index', error)

    return emailLib.sendMessage(
      'ops@opencollective.com', 
      'Error in updating index', 
      '',
      {
        bcc: ' ',
        text: error,
      },
    )
    .then(process.exit)
    .catch(console.error)
  }

  debug('Finished updating search records');
  process.exit();
}


// TODO: clean index once a week
const populateIndex = async () => {
  const collectives = await models.Collective.findAll({
    where: {
      type: collectiveTypes.COLLECTIVE,
      id: {
        [Op.notIn]: [1, 7]
      }
    },

    attributes: { 
      exclude: ['settings', 'data', 'longDescription'] 
    }, // exclude json fields to not fetch a lot of data
    order: ['id']
  });
  debug(`Collectives found: ${collectives.length}`);

  /*
    TODO: process data
    - remove repeating words like 'we are on a mission'
    - include events (currently not included because no way to redirect directly to the event without parentCollective info). Might be easiest to include a publicUrl in the metadata
  */

  const searchData = await Promise.map(collectives, async (collective) => {
    const [
      backersCount,
      balance,
      yearlyBudget,
    ] = await Promise.all([
      collective.getBackersCount(),
      collective.getBalance(),
      collective.getYearlyIncome(),
    ]);

    return {
      ...collective.searchIndex,
      backersCount,
      balance,
      yearlyBudget,
      objectID: collective.id
    };
  });

  debug('initializing search index');
  const index = initializeClientandIndex(ALGOLIA_INDEX);

  // we need to send these in batches, there is a limit of 18kb per request 
  const chunkedData = chunkArray(searchData, chunkSize);

  const indexedCount = await Promise.reduce(chunkedData, async (total, chunk) => {
    await index.addObjects(chunk);
    return total + chunk.length;
  }, 0);
  debug(`Total collectives indexed: ${indexedCount}`);
}


const initializeClientandIndex = (indexName) => {
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_KEY, { protocol: 'https:'});
  const index = client.initIndex(indexName);
  return index;
}

const run = () => {
  debug("Starting job to populate index on Algolia");
  return populateIndex()
    .then(() => done())
    .catch(done)
}

run();
