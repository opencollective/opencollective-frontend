import { GraphQLInt, GraphQLString } from 'graphql';

import models from '../../../models';

import { Collective } from '../object/Collective';

import { NotFound } from '../errors';

const CollectiveQuery = {
  type: Collective,
  args: {
    slug: { type: GraphQLString },
    id: { type: GraphQLInt },
  },
  async resolve(_, args) {
    let collective;
    if (args.slug) {
      collective = await models.Collective.findBySlug(args.slug.toLowerCase());
    } else if (args.id) {
      collective = await models.Collective.findById(args.id);
    } else {
      return new Error('Please provide a slug or an id');
    }
    if (!collective) {
      throw new NotFound({ message: 'Collective Not Found' });
    }
    if (collective.type !== 'COLLECTIVE') {
      throw new NotFound({ message: 'Not a Collective Account ' });
    }
    return collective;
  },
};

export default CollectiveQuery;
