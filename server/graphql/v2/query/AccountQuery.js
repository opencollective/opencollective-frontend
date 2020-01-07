import { GraphQLString, GraphQLBoolean } from 'graphql';

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
    githubHandle: {
      type: GraphQLString,
      description: 'The githubHandle attached to the account (ie: babel for https://opencollective.com/babel)',
    },
    throwIfMissing: {
      type: GraphQLBoolean,
      defaultValue: true,
      description: 'If false, will return null instead of an error if collective is not found',
    },
  },
  async resolve(_, args) {
    let collective;
    if (args.slug) {
      const slug = args.slug.toLowerCase();
      collective = await models.Collective.findBySlug(slug, null, args.throwIfMissing);
    } else if (args.id) {
      const id = idDecode(args.id, 'account');
      collective = await models.Collective.findByPk(id);
    } else if (args.githubHandle) {
      // Try with githubHandle, be it organization/user or repository
      collective = await models.Collective.findOne({ where: { githubHandle: args.githubHandle } });
      if (!collective && args.githubHandle.includes('/')) {
        // If it's a repository, try again with organization/user
        const [githubOrg] = args.githubHandle.split('/');
        collective = await models.Collective.findOne({ where: { githubHandle: githubOrg } });
      }
    } else {
      return new Error('Please provide a slug or an id');
    }
    if (!collective && args.throwIfMissing) {
      throw new NotFound({ message: 'Account Not Found' });
    }
    return collective;
  },
};

export default AccountQuery;
