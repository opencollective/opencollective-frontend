import { GraphQLInt, GraphQLList } from 'graphql';

import { MemberCollection } from '../collection/MemberCollection';
import { AccountType, AccountTypeToModelMapping } from '../enum/AccountType';
import { MemberRole } from '../enum/MemberRole';

import models, { Op } from '../../../models';

export const HasMembersFields = {
  members: {
    description: 'Get all members (admins, members, backers, followers)',
    type: MemberCollection,
    args: {
      limit: { type: GraphQLInt, defaultValue: 100 },
      offset: { type: GraphQLInt, defaultValue: 0 },
      role: { type: new GraphQLList(MemberRole) },
      accountType: { type: new GraphQLList(AccountType) },
    },
    async resolve(collective, args) {
      const where = { CollectiveId: collective.id };

      if (args.role && args.role.length > 0) {
        where.role = { [Op.in]: args.role };
      }
      const collectiveConditions = { deletedAt: null };
      if (args.accountType && args.accountType.length > 0) {
        collectiveConditions.type = {
          [Op.in]: args.accountType.map(value => AccountTypeToModelMapping[value]),
        };
      }

      const result = await models.Member.findAndCountAll({
        where,
        limit: args.limit,
        offset: args.offset,
        include: [
          {
            model: models.Collective,
            as: 'memberCollective',
            where: collectiveConditions,
          },
        ],
      });

      return { limit: args.limit, offset: args.offset, ...result };
    },
  },
};
