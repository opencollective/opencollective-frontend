import { GraphQLInt, GraphQLList } from 'graphql';

import { MemberOfCollection } from '../collection/MemberCollection';
import { AccountType } from '../enum/AccountType';
import { MemberRole } from '../object/Member';

import models, { Op } from '../../../models';

export const IsMemberOfFields = {
  memberOf: {
    type: MemberOfCollection,
    args: {
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt },
      role: { type: new GraphQLList(MemberRole) },
      accountType: { type: new GraphQLList(AccountType) },
    },
    resolve(collective, args) {
      const where = { MemberCollectiveId: collective.id };

      if (args.role && args.role.length > 0) {
        where.role = { [Op.in]: args.role };
      }
      const collectiveConditions = { deletedAt: null };
      if (args.accountType && args.accountType.length > 0) {
        collectiveConditions.type = { [Op.in]: args.accountType };
      }
      return models.Member.findAndCountAll({
        where,
        limit: args.limit,
        offset: args.offset,
        include: [
          {
            model: models.Collective,
            as: 'collective',
            where: collectiveConditions,
          },
        ],
      });
    },
  },
};
