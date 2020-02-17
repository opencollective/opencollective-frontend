import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLBoolean } from 'graphql';

import { getContextPermission, PERMISSION_TYPE } from '../../common/context-permissions';
import { Account, AccountFields } from '../interface/Account';
import models from '../../../models';
import { idDecode, IDENTIFIER_TYPES } from '../identifiers';

export const Individual = new GraphQLObjectType({
  name: 'Individual',
  description: 'This represents an Individual account',
  interfaces: () => [Account],
  isTypeOf: collective => collective.type === 'USER',
  fields: () => {
    return {
      ...AccountFields,
      firstName: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          return (
            userCollective && req.loaders.getUserDetailsByCollectiveId.load(userCollective.id).then(u => u.firstName)
          );
        },
      },
      lastName: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          return (
            userCollective && req.loaders.getUserDetailsByCollectiveId.load(userCollective.id).then(u => u.lastName)
          );
        },
      },
      email: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          if (!req.remoteUser) {
            return null;
          }
          return (
            userCollective && req.loaders.getUserDetailsByCollectiveId.load(userCollective.id).then(user => user.email)
          );
        },
      },
      isFollowingConversation: {
        type: new GraphQLNonNull(GraphQLBoolean),
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        async resolve(userCollective, args) {
          const conversationId = parseInt(idDecode(args.id, IDENTIFIER_TYPES.CONVERSATION));
          const userDetails = await models.User.findOne({
            where: { CollectiveId: userCollective.id },
            attributes: ['id'],
          });

          if (!userDetails) {
            return false;
          } else {
            return models.ConversationFollower.isFollowing(userDetails.id, conversationId);
          }
        },
      },
      location: {
        ...AccountFields.location,
        description: `
          Address. This field is public for hosts, otherwise:
            - Users can see their own address
            - Hosts can see the address of users submitting expenses to their collectives
        `,
        resolve(individual, _, req) {
          if (
            individual.isHost ||
            (req.remoteUser && req.remoteUser.isAdmin(individual.id)) ||
            getContextPermission(req, PERMISSION_TYPE.SEE_ACCOUNT_LOCATION, individual.id)
          ) {
            return individual.location;
          }
        },
      },
    };
  },
});

export default Individual;
