import { initGraphQLTada } from 'gql.tada';

import type { introspection } from './tada-introspection';

export const graphql = initGraphQLTada<{
  introspection: typeof introspection;
  scalars: {
    DateTime: string;
    Date: string;
    URL: string;
    EmailAddress: string;
    JSON: unknown;
    JSONObject: Record<string, unknown>;
    NonEmptyString: string;
    Upload: File;
    AccountSettingsKey: string;
    Locale: string;
    StrictPercentage: number;
    KYCVerificationReferenceInput: string;
  };
}>();

// Re-export useful types and utilities
export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
export { readFragment } from 'gql.tada';
