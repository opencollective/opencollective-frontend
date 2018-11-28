import { GraphQLString } from 'graphql';

import { Account } from '../interface/Account';

import models from '../../../models';

import { idDecode } from '../identifiers';

import { NotFound } from '../../errors';

const AccountQuery = {
  type: Account,
  args: {
    id: {
      type: GraphQLString,
      description: 'The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re)',
    },
    slug: {
      type: GraphQLString,
      description: 'The slug identifying the account (ie: babel for https://opencollective.com/babel)',
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
      throw new NotFound({ message: 'Account Not Found' });
    }
    return collective;
  },
};

export default AccountQuery;
