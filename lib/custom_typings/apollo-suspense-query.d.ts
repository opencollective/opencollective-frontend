declare module '@apollo/client/react/hooks/useSuspenseQuery' {
  export type FetchMoreFunction<TData = any, TVariables = any> = (...args: any[]) => Promise<any>;
}
