import { GraphQLInt, GraphQLString } from 'graphql';

import { Account } from '../interface/Account';

import models from '../../../models';

import { NotFound } from '../errors';

const AccountQuery = {
  type: Account,
  args: {
    slug: { type: GraphQLString },
    id: { type: GraphQLInt },
  },
  resolve(_, args) {
    let collective;
    if (args.slug) {
      collective = models.Collective.findBySlug(args.slug.toLowerCase());
    } else if (args.id) {
      collective = models.Collective.findById(args.id);
    } else {
      return new Error('Please provide a slug or an id');
    }
    if (!collective) {
      throw new NotFound({ message: 'Account Not Found' });
    }
    return collective;
  },
};

export default AccountQuery;
