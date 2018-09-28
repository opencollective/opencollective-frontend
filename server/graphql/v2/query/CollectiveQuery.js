import { GraphQLString } from 'graphql';

import models from '../../../models';

import { Collective } from '../object/Collective';

import { idDecode } from '../identifiers';

import { NotFound } from '../../errors';

const CollectiveQuery = {
  type: Collective,
  args: {
    id: {
      type: GraphQLString,
      description:
        'The public id identifying the account (ie: 5v08jk63-w4g9nbpz-j7qmyder-p7ozax5g)',
    },
    slug: {
      type: GraphQLString,
      description:
        'The slug identifying the account (ie: babel for https://opencollective.com/babel)',
    },
  },
  async resolve(_, args) {
    let collective;
    if (args.slug) {
      const slug = args.slug.toLowerCase();
      collective = await models.Collective.findBySlug(slug);
    } else if (args.id) {
      const id = idDecode(args.id, 'account');
      collective = await models.Collective.findById(id);
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
