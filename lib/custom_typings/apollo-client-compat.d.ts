declare module '@apollo/client' {
  export * from '@apollo/client/core';
  export * from '@apollo/client/react';
  export { mergeDeep } from '@apollo/client/utilities/internal';
  export { CombinedGraphQLErrors as ApolloError } from '@apollo/client/errors';
  export type { MutationFunctionOptions as MutationFunction } from '@apollo/client/react';
  export type MutationFunction<TData = any, TVariables = any> = (options?: {
    variables?: TVariables;
    update?: (cache: ApolloCache<any>, result: { data?: TData }) => void;
  }) => Promise<{ data?: TData; errors?: any[] }>;

  export type ApolloQueryResult<TData = any> = {
    data: TData;
    error?: any;
    errors?: any[];
    loading?: boolean;
  };

  // Preserve v3-style generics for gradual migration.
  export class ApolloClient<TCacheShape = any> {
    constructor(options: any);
    query<TData = any, TVariables = any>(
      options: any,
    ): Promise<{
      data: TData;
      error?: any;
      errors?: any[];
      loading?: boolean;
    }>;

    mutate<TData = any, TVariables = any>(
      options: any,
    ): Promise<{
      data: TData;
      error?: any;
      errors?: any[];
      loading?: boolean;
    }>;

    readQuery<T = any>(options: any): T;
    writeQuery<T = any>(options: any): void;
    cache: ApolloCache<TCacheShape>;
  }

  export class ApolloCache<TShape = any> {
    readQuery<T = any, TVariables = any>(options: any): T;
    writeQuery<T = any>(options: any): void;
    extract(): NormalizedCacheObject;
    evict(options: any): boolean;
    identify(options: any): string | undefined;
    modify(options: any): boolean;
  }
}

declare module '@apollo/client/testing' {
  export { MockedProvider } from '@apollo/client/testing/react';
  export type { MockedResponse } from '@apollo/client/testing';
}

declare module '@apollo/client/react/hoc' {
  export function graphql<TProps = any, TChildProps = any, TVariables = any>(
    document: unknown,
    operationOptions?: Record<string, unknown>,
  ): <T>(component: T) => T;
  export function withQuery<TProps = any>(
    document: unknown,
    operationOptions?: Record<string, unknown>,
  ): <T>(component: T) => T;
  export function withMutation<TProps = any, TData = any, TVariables = any>(
    document: unknown,
    operationOptions?: Record<string, unknown>,
  ): <T>(component: T) => T;
  export function withSubscription<TProps = any>(
    document: unknown,
    operationOptions?: Record<string, unknown>,
  ): <T>(component: T) => T;
  export function withApollo<T>(component: T): T;
}

declare module '@apollo/client/react/components' {
  import type React from 'react';

  export class Query<TData = unknown, TVariables = Record<string, unknown>> extends React.Component<
    Record<string, unknown>
  > {
    render(): React.ReactNode;
  }

  export class Mutation<TData = unknown, TVariables = Record<string, unknown>> extends React.Component<
    Record<string, unknown>
  > {
    render(): React.ReactNode;
  }

  export class Subscription<TData = unknown, TVariables = Record<string, unknown>> extends React.Component<
    Record<string, unknown>
  > {
    render(): React.ReactNode;
  }
}
