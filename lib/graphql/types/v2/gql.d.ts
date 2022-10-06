/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

declare module "./lib/graphql/types/v2" {

  export function gqlV2(source: "\n  mutation ClearCache($account: AccountReferenceInput!, $cacheTypes: [AccountCacheType!]) {\n    clearCacheForAccount(account: $account, type: $cacheTypes) {\n      id\n      slug\n      name\n    }\n  }\n"): typeof import('./graphql').ClearCacheDocument;
  export function gqlV2(source: string): unknown;

    export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<    infer TType,    any  >    ? TType    : never;  
}