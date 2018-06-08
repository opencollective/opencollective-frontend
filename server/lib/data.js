import path from 'path';
import fs from 'fs-extra';
import { Op } from 'sequelize';

import models from '../models';

export async function getRecommendedCollectives(collective, limit) {
  const recommandationsFilename = path.join(
    __dirname, '..', '..', 'data', 'collective-recommendations.json'
  );
  const recommandations = await fs.readJson(recommandationsFilename).catch(() => null);
  if (recommandations && recommandations[collective.id]) {
    const ids = recommandations[collective.id].recommendations.map(r => r.id).slice(0, limit);
    return models.Collective.findAll({ where: { id: { [Op.in]: ids } } })
  } else {
    return [];
  }
}
