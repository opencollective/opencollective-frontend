import {
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLEnumType,
  GraphQLNonNull,
} from 'graphql';

const ApplicationTypeType = new GraphQLEnumType({
  name: 'ApplicationType',
  description: 'All application types',
  values: {
    API_KEY: { value: 'apiKey' },
    OAUTH: { value: 'oAuth' },
  },
});

export const ApplicationType = new GraphQLObjectType({
  name: 'Application',
  description: 'Application model',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(application) {
          return application.id;
        },
      },
      type: {
        type: ApplicationTypeType,
        resolve(application) {
          return application.type;
        },
      },
      name: {
        type: GraphQLString,
        resolve(application) {
          return application.name;
        },
      },
      description: {
        type: GraphQLString,
        resolve(application) {
          return application.description;
        },
      },
      apiKey: {
        type: GraphQLString,
        resolve(application, args, req) {
          if (
            req.remoteUser &&
            req.remoteUser.id === application.CreatedByUserId
          ) {
            return application.apiKey;
          }
        },
      },
      clientId: {
        type: GraphQLString,
        resolve(application, args, req) {
          if (
            req.remoteUser &&
            req.remoteUser.id === application.CreatedByUserId
          ) {
            return application.clientId;
          }
        },
      },
      clientSecret: {
        type: GraphQLString,
        resolve(application, args, req) {
          if (
            req.remoteUser &&
            req.remoteUser.id === application.CreatedByUserId
          ) {
            return application.clientSecret;
          }
        },
      },
      callbackUrl: {
        type: GraphQLString,
        resolve(application, args, req) {
          if (
            req.remoteUser &&
            req.remoteUser.id === application.CreatedByUserId
          ) {
            return application.callbackUrl;
          }
        },
      },
    };
  },
});

export const ApplicationInputType = new GraphQLInputObjectType({
  name: 'ApplicationInput',
  description: 'Input type for Application',
  fields: () => ({
    type: { type: new GraphQLNonNull(ApplicationTypeType) },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    callbackUrl: { type: GraphQLString },
  }),
});
