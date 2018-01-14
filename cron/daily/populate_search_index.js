import config from 'config';
import algoliasearch from 'algoliasearch';
import Promise from 'bluebird';

import models from '../../server/models';
import { types as collectiveTypes } from '../../server/constants/collectives';
import { chunkArray } from '../../server/lib/utils';
import emailLib from '../../server/lib/email';

const ALGOLIA_APP_ID = config.algolia.appId;
const ALGOLIA_KEY = config.algolia.appKey;
const ALGOLIA_INDEX = 'collectives';
const chunkSize = 10; // number of collectives to send at once


const done = (err) => {
  if (err) {
    console.log('err', err)
    return emailLib.sendMessage(
    'ops@opencollective.com', 
    'Error in updating index', 
    '', {
      bcc: ' ',
      text: err
    })
    .then(process.exit)
    .catch(console.error)
  }
  console.log('Finished updating search records');
  process.exit();
}


// TODO: clean index once a week
const populateIndex = () => {
  return models.Collective.findAll({
    where: {
      type: collectiveTypes.COLLECTIVE,
      id: {
        $notIn: [1, 7]
      }
    },

    attributes: { 
      exclude: ['settings', 'data'] 
    }, // exclude json fields to not fetch a lot of data
    order: ['id']
  })
  .map(c => c.searchIndex)
  .then(collectives => {
    console.log("Collectives found", collectives.length);
    /*
      TODO: process data
      - remove repeating words like 'we are on a mission'
      - include other metadata: budget, amount available, backers, etc. (useful for ranking)
      - include events (currently not included because no way to redirect directly to the event without parentCollective info). Might be easiest to include a publicUrl in the metadata
    */

    // objectID is needed for algolia to build their own index
    return collectives.map(el => Object.assign(el, { objectID: el.id }));
  })
  .then(data => {
    console.log("initializing search index");
    const index = initializeClientandIndex(ALGOLIA_INDEX);
    let recordsUpdated = 0;

    // we need to send these in batches, there is a limit of 18kb per request 
    const splitData = chunkArray(data, chunkSize); 
  
    return Promise.each(splitData, (collectives) => {
      console.log("Adding to index: ", `${collectives.length}`);
      return index.addObjects(data)
        .then(() => recordsUpdated += collectives.length)
      })
    .then(() => console.log("Total collectives indexed: ", recordsUpdated));
  })
}


const initializeClientandIndex = (indexName) => {
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_KEY, { protocol: 'https:'});
  const index = client.initIndex(indexName);
  return index;
}

const run = () => {
  console.log("Starting job to populate index on Algolia");
  return populateIndex()
    .then(() => done())
    .catch(done)
}

run();