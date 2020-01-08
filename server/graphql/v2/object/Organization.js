import { GraphQLString, GraphQLObjectType } from 'graphql';

import { Account, AccountFields } from '../interface/Account';

export const Organization = new GraphQLObjectType({
  name: 'Organization',
  description: 'This represents an Organization account',
  interfaces: () => [Account],
  isTypeOf: collective => collective.type === 'ORGANIZATION',
  fields: () => {
    return {
      ...AccountFields,
      email: {
        type: GraphQLString,
        resolve(orgCollective, args, req) {
          if (!req.remoteUser) {
            return null;
          }
          return (
            orgCollective && req.loaders.getOrgDetailsByCollectiveId.load(orgCollective.id).then(user => user.email)
          );
        },
      },
    };
  },
});
