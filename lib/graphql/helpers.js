import gql from 'graphql-tag';

/** A wrapper arround `gql` to ensure linter applies API v2 schema */
export const gqlV2 = gql;

/** To pass as a context to your query/mutation to use API v2 */
export const API_V2_CONTEXT = { apiVersion: '2' };
