#!/usr/bin/env node
import '../../server/env';

import { Op } from 'sequelize';
import moment from 'moment-timezone';
import debugLib from 'debug';

import algolia from '../../server/lib/algolia';
import emailLib from '../../server/lib/email';
import models from '../../server/models';
import { types as collectiveTypes } from '../../server/constants/collectives';

const debug = debugLib('clean_search_index');

const yesterday = moment()
  .tz('America/New_York')
  .startOf('day')
  .subtract(1, 'days')
  .format();

const done = error => {
  if (error) {
    debug('Error when cleaning index', error);

    return emailLib
      .sendMessage('ops@opencollective.com', 'Error when cleaning search index', '', {
        bcc: ' ',
        text: error,
      })
      .then(process.exit)
      .catch(console.error);
  }

  debug('Finished removing deleted records from search index');
  process.exit();
};

const cleanIndex = async () => {
  const collectives = await models.Collective.findAll({
    where: {
      [Op.or]: [
        {
          deletedAt: {
            [Op.gt]: yesterday,
          },
        },
        {
          deactivatedAt: {
            [Op.gt]: yesterday,
          },
        },
      ],
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
    const index = algolia.getIndex();
    return index.deleteObjects(ids);
  }
  return;
};

debug('Starting job to cleanup deleted records in search index');
cleanIndex()
  .then(() => done())
  .catch(done);
