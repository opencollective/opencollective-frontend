import '../server/env';

import models, { Op } from '../server/models';

async function main() {
  const collectives = await models.Collective.findAll({
    where: { image: { [Op.eq]: null } },
  });
  for (const collective of collectives) {
    if (collective.type === 'USER') {
      const user = await collective.getUser();
      collective.findImageForUser(user);
    } else {
      collective.findImage();
    }
  }
  console.log('Done.');
}

main();
