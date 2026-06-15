import type { DocumentNode } from 'graphql';

declare module '@apollo/client/react' {
  // Apollo Client v4 defaults query data to `unknown`; keep v3-like ergonomics in this codebase.
  export function useQuery<TData = any, TVariables = any>(
    query: DocumentNode,
    options?: Record<string, any>,
  ): {
    data: TData;
    previousData?: TData;
    loading: boolean;
    error: any;
    refetch: (...args: any[]) => Promise<any>;
    fetchMore: (...args: any[]) => Promise<any>;
    networkStatus: number;
    called: boolean;
    client: any;
    variables?: TVariables;
    startPolling: (pollInterval: number) => void;
    stopPolling: () => void;
  };

  export function useLazyQuery<TData = any, TVariables = any>(
    query: DocumentNode,
    options?: Record<string, any>,
  ): [
    (options?: Record<string, any>) => Promise<any>,
    {
      data: TData;
      previousData?: TData;
      loading: boolean;
      error: any;
      refetch: (...args: any[]) => Promise<any>;
      fetchMore: (...args: any[]) => Promise<any>;
      called: boolean;
      client: any;
    },
  ];

  export function useMutation<TData = any, TVariables = any>(
    mutation: DocumentNode,
    options?: Record<string, any>,
  ): [
    (options?: Record<string, any> & { update?: (...args: any[]) => void }) => Promise<any>,
    {
      data: TData;
      loading: boolean;
      error: any;
      called: boolean;
      reset: () => void;
      client: any;
    },
  ];

  export type QueryResult<TData = any, TVariables = any> = ReturnType<typeof useQuery<TData, TVariables>>;

  export function useFragment<TData = any>(options: Record<string, any>): {
    data: TData;
    complete: boolean;
    missing?: any;
  };
}
