import React from 'react';
import type { DocumentNode } from 'graphql';
import { useMutation, useQuery } from '@apollo/client/react';

type QueryProps = {
  query: DocumentNode;
  variables?: Record<string, unknown>;
  children: (result: ReturnType<typeof useQuery>) => React.ReactNode;
  skip?: boolean;
  fetchPolicy?: string;
  context?: Record<string, unknown>;
};

export function Query({ query, variables, children, skip, fetchPolicy, context }: QueryProps) {
  const result = useQuery(query, { variables, skip, fetchPolicy, context });
  return <>{children(result)}</>;
}

type MutationProps = {
  mutation: DocumentNode;
  children: (mutate: ReturnType<typeof useMutation>[0], result: ReturnType<typeof useMutation>[1]) => React.ReactNode;
  variables?: Record<string, unknown>;
  refetchQueries?: unknown;
  awaitRefetchQueries?: boolean;
};

export function Mutation({ mutation, children, variables, refetchQueries, awaitRefetchQueries }: MutationProps) {
  const [mutate, result] = useMutation(mutation, { variables, refetchQueries, awaitRefetchQueries });
  return <>{children(mutate, result)}</>;
}

export function Subscription() {
  throw new Error('Subscription component is not implemented in the Apollo compatibility layer.');
}
