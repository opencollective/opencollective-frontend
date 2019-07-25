import path from 'path';
import fs from 'fs-extra';
import { Op } from 'sequelize';
import { differenceBy } from 'lodash';

import models from '../models';

export async function getRecommendedCollectives(collective, limit) {
  const recommandationsFilename = path.join(__dirname, '..', '..', 'data', 'collective-recommendations.json');
  const recommandations = await fs.readJson(recommandationsFilename).catch(() => null);
  if (recommandations && recommandations[collective.id]) {
    const ids = recommandations[collective.id].recommendations.map(r => r.id).slice(0, limit);
    return models.Collective.findAll({ where: { id: { [Op.in]: ids } } });
  } else {
    return [];
  }
}

/**
 * Diff two lists of DB objects and returns which ones where created, removed and updated.
 * Usefull for places where we update an attribute by providing a list.
 *
 * @param {Array} oldEntries: Existing entries
 * @param {Array} newEntries: New entries to update with
 * @param {Array} diffedFields: The fields used to compare objects for ``
 * @returns [newEntries, removedEntries, updatedEntries]
 */
export function diffDBEntries(oldEntries, newEntries, diffedFields) {
  const toRemove = differenceBy(oldEntries, newEntries, 'id');
  const toCreate = [];
  const toUpdate = [];

  newEntries.forEach(entry => {
    if (!entry.id) {
      toCreate.push(entry);
    } else {
      const existingEntry = oldEntries.find(e => e.id === entry.id);
      // We throw here to protect against security issues where users would try
      // to update an entry that doesn't exist among `oldEntries`. Example: trying
      // to update an existing member that's part of another collective.
      // The error can also be throwed if users edit an entity that has been removed in
      // another tab or by someone else.
      if (!existingEntry) {
        throw new Error(
          "One of the entity you're trying to update doesn't exist or has changes. Please refresh the page.",
        );
      } else if (!diffedFields.every(field => existingEntry[field] === entry[field])) {
        toUpdate.push(entry);
      }
    }
  });

  return [toCreate, toRemove, toUpdate];
}
