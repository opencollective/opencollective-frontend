import debug from 'debug';
import { graphql } from 'graphql';
import { loaders } from './loaders';
import schema from './schema';

export const makeRequest = (remoteUser, query) => {
  return {
    remoteUser,
    body: { query },
    loaders: loaders({ remoteUser }),
  };
};

export const graphqlQuery = async (query, variables, remoteUser) => {
  const prepare = () => {
    if (remoteUser) {
      remoteUser.rolesByCollectiveId = null; // force refetching the roles
      return remoteUser.populateRoles();
    } else {
      return Promise.resolve();
    }
  };

  if (process.env.DEBUG && process.env.DEBUG.match(/graphql/)) {
    debug('graphql')('query', query);
    debug('graphql')('variables', variables);
    debug('graphql')('context', remoteUser);
  }

  return prepare().then(() =>
    graphql(
      schema,
      query,
      null, // rootValue
      makeRequest(remoteUser, query), // context
      variables,
    ),
  );
};
