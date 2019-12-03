import { GraphQLString, GraphQLBoolean } from 'graphql';

import { Collective } from '../object/Collective';
import models from '../../../models';
import { idDecode } from '../identifiers';
import { NotFound } from '../../errors';

const CollectiveQuery = {
  type: Collective,
  args: {
    id: {
      type: GraphQLString,
      description: 'The public id identifying the collective (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re)',
    },
    slug: {
      type: GraphQLString,
      description: 'The slug identifying the collective (ie: babel for https://opencollective.com/babel)',
    },
    githubHandle: {
      type: GraphQLString,
      description: 'The githubHandle attached to the collective (ie: babel for https://opencollective.com/babel)',
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

    if (args.throwIfMissing && (!collective || collective.type !== 'COLLECTIVE')) {
      throw new NotFound({ message: 'Collective Not Found' });
    }
    return collective;
  },
};

export default CollectiveQuery;
