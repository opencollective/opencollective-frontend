import '../server/env';

import fetch from 'isomorphic-fetch';

import models, { Op } from '../server/models';

async function main() {
  const collectives = await models.Collective.findAll({
    where: {
      image: { [Op.iLike]: '%logo.clearbit.com%' },
    },
  });
  for (const collective of collectives) {
    const response = await fetch(collective.image);
    if (response.status == 404) {
      console.log(`Image for ${collective.slug} not found: ${collective.image}`);
      await collective.update({ image: null });
    }
  }
  console.log('Done.');
}

main();
