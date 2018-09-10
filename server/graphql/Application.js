import {
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInputObjectType,
} from 'graphql';

export const ApplicationType = new GraphQLObjectType({
  name: 'Application',
  description: 'Application model',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(application) {
          return application.id;
        }
      },
      name: {
        type: GraphQLString,
        resolve(application) {
          return application.name;
        }
      },
      description: {
        type: GraphQLString,
        resolve(application) {
          return application.description;
        }
      },
      clientId: {
        type: GraphQLString,
        resolve(application, args, req) {
          if (req.remoteUser.id === application.CreatedByUserId) {
            return application.clientId;
          }
        }
      },
      clientSecret: {
        type: GraphQLString,
        resolve(application, args, req) {
          if (req.remoteUser.id === application.CreatedByUserId) {
            return application.clientSecret;
          }
        }
      },
      callbackUrl: {
        type: GraphQLString,
        resolve(application, args, req) {
          if (req.remoteUser.id === application.CreatedByUserId) {
            return application.callbackUrl;
          }
        }
      },
    }
  }
});

export const ApplicationInputType = new GraphQLInputObjectType({
  name: 'ApplicationInput',
  description: 'Input type for Application',
  fields: () => ({
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    callbackUrl: { type: GraphQLString },
  })
});
