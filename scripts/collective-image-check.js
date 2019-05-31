import '../server/env';

import fetch from 'isomorphic-fetch';

import models, { Op } from '../server/models';

const searchPattern = process.argv[2];
if (!searchPattern) {
  console.log('Please pass a search pattern to filter collective images to process.');
  console.log('Ie: %logo.clearbit.com% or %pbs.twimg.com% or %opencollective-production.s3.us-west-1.amazonaws.com%');
  process.exit();
}

async function main() {
  const collectives = await models.Collective.findAll({
    where: {
      image: { [Op.iLike]: searchPattern },
    },
  });
  for (const collective of collectives) {
    let response;
    try {
      response = await fetch(collective.image);
    } catch (e) {
      console.log(e);
      continue;
    }
    if (response.status == 404) {
      console.log(`Image for ${collective.slug} not found: ${collective.image}`);
      try {
        await collective.update({ image: null });
      } catch (e) {
        console.log(e);
      }
      continue;
    }
    if (response.status == 403) {
      console.log(`Image for ${collective.slug} access denied: ${collective.image}`);
      try {
        await collective.update({ image: null });
      } catch (e) {
        console.log(e);
      }
      continue;
    }
    const body = await response.text();
    if (body.length === 0) {
      console.log(`Image for ${collective.slug} invalid: ${collective.image}`);
      try {
        await collective.update({ image: null });
      } catch (e) {
        console.log(e);
      }
    }
  }
  console.log('Done.');
}

main();
