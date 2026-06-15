import React from 'react';
import type { DocumentNode } from 'graphql';
import { getOperationAST } from 'graphql';
import { useApolloClient, useMutation, useQuery, useSubscription } from '@apollo/client/react';

type OperationOptions<TProps> = {
  options?: ((props: TProps) => Record<string, unknown>) | Record<string, unknown>;
  skip?: ((props: TProps) => boolean) | boolean;
  props?: (result: Record<string, unknown>) => Record<string, unknown>;
  name?: string;
};

const getOptions = <TProps,>(operationOptions: OperationOptions<TProps>, props: TProps) => {
  const { options = {} } = operationOptions;
  return typeof options === 'function' ? options(props) : options;
};

const getSkip = <TProps,>(operationOptions: OperationOptions<TProps>, props: TProps) => {
  const { skip } = operationOptions;
  return typeof skip === 'function' ? skip(props) : skip;
};

const mapResultToProps = <TProps,>(operationOptions: OperationOptions<TProps>, result: Record<string, unknown>) => {
  if (operationOptions.props) {
    return operationOptions.props(result);
  }

  return { data: result };
};

export function withQuery<TProps extends object>(
  document: DocumentNode,
  operationOptions: OperationOptions<TProps> = {},
) {
  return <TChildProps extends object>(WrappedComponent: React.ComponentType<TProps & TChildProps>) => {
    const WithQuery = (props: TProps) => {
      const queryResult = useQuery(document, {
        ...getOptions(operationOptions, props),
        skip: getSkip(operationOptions, props),
      });
      const childProps = mapResultToProps(operationOptions, queryResult as Record<string, unknown>);
      return <WrappedComponent {...props} {...(childProps as TChildProps)} />;
    };

    WithQuery.displayName = `withQuery(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    return WithQuery;
  };
}

export function withMutation<TProps extends object>(
  document: DocumentNode,
  operationOptions: OperationOptions<TProps> = {},
) {
  return <TChildProps extends object>(WrappedComponent: React.ComponentType<TProps & TChildProps>) => {
    const WithMutation = (props: TProps) => {
      const [mutate, mutationResult] = useMutation(document, getOptions(operationOptions, props));
      const childProps = mapResultToProps(operationOptions, {
        mutate,
        ...mutationResult,
      } as Record<string, unknown>);
      return <WrappedComponent {...props} {...(childProps as TChildProps)} />;
    };

    WithMutation.displayName = `withMutation(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    return WithMutation;
  };
}

export function withSubscription<TProps extends object>(
  document: DocumentNode,
  operationOptions: OperationOptions<TProps> = {},
) {
  return <TChildProps extends object>(WrappedComponent: React.ComponentType<TProps & TChildProps>) => {
    const WithSubscription = (props: TProps) => {
      const subscriptionResult = useSubscription(document, {
        ...getOptions(operationOptions, props),
        skip: getSkip(operationOptions, props),
      });
      const childProps = mapResultToProps(operationOptions, subscriptionResult as unknown as Record<string, unknown>);
      return <WrappedComponent {...props} {...(childProps as TChildProps)} />;
    };

    WithSubscription.displayName = `withSubscription(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    return WithSubscription;
  };
}

export function graphql<TProps extends object = any>(
  document: DocumentNode,
  operationOptions: OperationOptions<TProps> = {},
) {
  const operation = getOperationAST(document)?.operation;

  if (operation === 'mutation') {
    return withMutation(document, operationOptions);
  }

  if (operation === 'subscription') {
    return withSubscription(document, operationOptions);
  }

  return withQuery(document, operationOptions);
}

export function withApollo<TProps extends object>(
  WrappedComponent: React.ComponentType<TProps & { client?: unknown }>,
) {
  const WithApollo = (props: TProps) => {
    const client = useApolloClient();
    return <WrappedComponent {...props} client={client} />;
  };

  WithApollo.displayName = `withApollo(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithApollo;
}
