'use client';

import React from 'react';
import type { NormalizedCacheObject } from '@apollo/client';
import { ApolloNextAppProvider } from '@apollo/client-integration-nextjs';

import { createApolloClient } from '../lib/ApolloClient';

interface ClientApolloProviderProps {
  children: React.ReactNode;
  initialState?: NormalizedCacheObject;
  twoFactorAuthContext?: any;
}

// Create a makeClient function that works with the new RSC setup
function makeClient() {
  return createApolloClient();
}

export default function ClientApolloProvider({
  children,
  initialState,
  twoFactorAuthContext,
}: ClientApolloProviderProps) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
