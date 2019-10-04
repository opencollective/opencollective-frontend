#!/usr/bin/env node
import '../server/env';

import { Op } from 'sequelize';
import debugLib from 'debug';

import algolia from '../server/lib/algolia';
import emailLib from '../server/lib/email';
import models from '../server/models';
import { types as collectiveTypes } from '../server/constants/collectives';

const debug = debugLib('collectives_archived_search_index_cleanup');

const done = error => {
  if (error) {
    debug('Error when cleaning index', error);

    return emailLib
      .sendMessage('ops@opencollective.com', 'Error when cleaning search index from archived collectives', '', {
        bcc: ' ',
        text: error,
      })
      .then(process.exit)
      .catch(console.error);
  }

  debug('Finished removing archived records from search index');
  process.exit();
};

const cleanIndex = async () => {
  const collectives = await models.Collective.findAll({
    where: {
      isActive: false,
      deactivatedAt: {
        [Op.not]: null,
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
    const index = algolia.getIndex();
    return index.deleteObjects(ids);
  }
  return;
};

debug('Starting one-time job to cleanup archived records in search index');
cleanIndex()
  .then(() => done())
  .catch(done);
