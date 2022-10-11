import { gql } from '@apollo/client';

/** A wrapper arround `gql` to ensure linter applies API v1 schema */
export const gqlV1 = gql;

/** To pass as a context to your query/mutation to use API v2 */
export const API_V2_CONTEXT = { apiVersion: '2' };
