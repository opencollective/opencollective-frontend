import '../server/env';

import models, { Op } from '../server/models';

async function main() {
  const collectives = await models.Collective.findAll({
    where: {
      image: { [Op.ne]: null },
      name: { [Op.or]: { [Op.eq]: null, [Op.eq]: 'anonymous' } },
    },
  });
  for (const collective of collectives) {
    if (collective.image.includes('opencollective-production')) {
      continue;
    }
    console.log(`Deleting image for ${collective.slug}: ${collective.image}`);
    await collective.update({ image: null });
  }
  console.log('Done.');
}

main();
