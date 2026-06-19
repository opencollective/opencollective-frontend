import type React from 'react';

declare module '@apollo/client/testing/react' {
  export interface MockedProviderProps {
    mocks?: any[];
    addTypename?: boolean;
    children?: React.ReactNode;
    cache?: any;
    defaultOptions?: any;
    showWarnings?: boolean;
  }

  export class MockedProvider extends React.Component<MockedProviderProps> {}
}
