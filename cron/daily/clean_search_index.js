import config from 'config';
import algoliasearch from 'algoliasearch';
import { Op } from 'sequelize';
import moment from 'moment-timezone';

import models from '../../server/models';
import { types as collectiveTypes } from '../../server/constants/collectives';
import emailLib from '../../server/lib/email';
import debugLib from 'debug';

const debug = debugLib('clean_search_index');

const {
  appId: ALGOLIA_APP_ID,
  appKey: ALGOLIA_KEY,
  index: ALGOLIA_INDEX,
} = config.algolia;

const yesterday = moment()
  .tz('America/New_York')
  .startOf('day')
  .subtract(1, 'days')
  .format();

const done = (error) => {
  if (error) {
    debug('Error when cleaning index', error);

    return emailLib.sendMessage(
      'ops@opencollective.com',
      'Error when cleaning search index',
      '',
      {
        bcc: ' ',
        text: error,
      },
    )
    .then(process.exit)
    .catch(console.error);
  }

  debug('Finished removing deleted records from search index');
  process.exit();
};

const initializeClientandIndex = (indexName) => {
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_KEY, { protocol: 'https:'});
  const index = client.initIndex(indexName);
  return index;
}

const cleanIndex = async () => {
  const collectives = await models.Collective.findAll({
    where: {
      deletedAt: {
        [Op.gt]: yesterday,
      },
      type: {
        [Op.or]: [collectiveTypes.COLLECTIVE, collectiveTypes.ORGANIZATION],
      },
    },
    attributes: ['id'],
    order: ['id'],
    paranoid: false,
  });
  const ids = collectives.map(c => c.dataValues.id);
  debug(`Collectives found: ${collectives.length}`, ids);

  if (collectives.length > 0) {
    const index = initializeClientandIndex(ALGOLIA_INDEX);
    return index.deleteObjects(ids);
  }
  return;
};

debug('Starting job to cleanup deleted records in search index');
cleanIndex().then(() => done()).catch(done);
