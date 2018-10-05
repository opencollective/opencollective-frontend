import { GraphQLString, GraphQLObjectType } from 'graphql';

import { Account, AccountFields } from '../interface/Account';

export const User = new GraphQLObjectType({
  name: 'User',
  description: 'This represents a User account',
  interfaces: () => [Account],
  isTypeOf: collective => collective.type === 'USER',
  fields: () => {
    return {
      ...AccountFields,
      firstName: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          return (
            userCollective &&
            req.loaders.getUserDetailsByCollectiveId
              .load(userCollective.id)
              .then(u => u.firstName)
          );
        },
      },
      lastName: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          return (
            userCollective &&
            req.loaders.getUserDetailsByCollectiveId
              .load(userCollective.id)
              .then(u => u.lastName)
          );
        },
      },
      email: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          if (!req.remoteUser) return null;
          return (
            userCollective &&
            req.loaders.getUserDetailsByCollectiveId
              .load(userCollective.id)
              .then(user => user.email)
          );
        },
      },
    };
  },
});
