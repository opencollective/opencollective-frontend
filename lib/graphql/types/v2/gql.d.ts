/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

declare module "@apollo/client" {

  export function gql(source: "\n  mutation ClearCache($account: AccountReferenceInput!, $cacheTypes: [AccountCacheType!]) {\n    clearCacheForAccount(account: $account, type: $cacheTypes) {\n      id\n      slug\n      name\n    }\n  }\n"): typeof import('./graphql').ClearCacheDocument;
  export function gql(source: string): unknown;

    export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<    infer TType,    any  >    ? TType    : never;  
}