import { GraphQLObjectType, GraphQLBoolean } from 'graphql';

import { Account, AccountFields } from '../interface/Account';

export const Event = new GraphQLObjectType({
  name: 'Event',
  description: 'This represents an Event account',
  interfaces: () => [Account],
  isTypeOf: collective => collective.type === 'EVENT',
  fields: () => {
    return {
      ...AccountFields,
      isApproved: {
        description: 'Returns whether this collective is approved',
        type: GraphQLBoolean,
        async resolve(event, _, req) {
          if (event.ParentCollectiveId) {
            return false;
          }

          const parentCollective = await req.loaders.Collective.byId.load(event.ParentCollectiveId);
          return Boolean(
            parentCollective &&
              parentCollective.HostCollectiveId &&
              parentCollective.isActive &&
              parentCollective.approvedAt,
          );
        },
      },
    };
  },
});
