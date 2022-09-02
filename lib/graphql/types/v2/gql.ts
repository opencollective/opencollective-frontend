/* eslint-disable */
import * as graphql from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

const documents = {
    "\n  mutation ClearCache($account: AccountReferenceInput!) {\n    clearCacheForAccount(account: $account) {\n      id\n      slug\n      name\n    }\n  }\n": graphql.ClearCacheDocument,
};

export function gql(source: "\n  mutation ClearCache($account: AccountReferenceInput!) {\n    clearCacheForAccount(account: $account) {\n      id\n      slug\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation ClearCache($account: AccountReferenceInput!) {\n    clearCacheForAccount(account: $account) {\n      id\n      slug\n      name\n    }\n  }\n"];

export function gql(source: string): unknown;
export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;