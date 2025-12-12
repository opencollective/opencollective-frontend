import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { adminPanelQuery } from '../components/dashboard/queries';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { useWorkspace } from '../components/WorkspaceProvider';

export default function DebugDashboardPage() {
  const router = useRouter();
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const { workspace } = useWorkspace();
  
  const defaultSlug = workspace?.slug || LoggedInUser?.collective?.slug;
  const activeSlug = (router.query.slug as string) || defaultSlug;

  const { data, loading, error: queryError } = useQuery(adminPanelQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: activeSlug },
    skip: !activeSlug || !LoggedInUser,
    errorPolicy: 'all',
  });

  const account = data?.account;
  const token = typeof window !== 'undefined' ? getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN) : null;

  const diagnostic = {
    timestamp: new Date().toISOString(),
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 30)}...` : null,
    loadingLoggedInUser,
    LoggedInUser: LoggedInUser ? {
      id: LoggedInUser.id,
      email: LoggedInUser.email,
      hasCollective: !!LoggedInUser.collective,
      collectiveSlug: LoggedInUser.collective?.slug,
      collectiveId: LoggedInUser.collective?.id,
      collectiveName: LoggedInUser.collective?.name,
      requiresProfileCompletion: LoggedInUser.requiresProfileCompletion,
      memberOf: LoggedInUser.memberOf?.map(m => ({
        slug: m.collective?.slug,
        role: m.role,
      })),
    } : null,
    workspace: {
      slug: workspace?.slug,
    },
    activeSlug,
    queryLoading: loading,
    queryError: queryError ? {
      message: queryError.message,
      graphQLErrors: queryError.graphQLErrors,
      networkError: queryError.networkError?.message,
    } : null,
    account: account ? {
      id: account.id,
      slug: account.slug,
      name: account.name,
      type: account.type,
      isArchived: account.isArchived,
      isActive: account.isActive,
    } : null,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔍 Dashboard Diagnostics</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>Authentication</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
          {JSON.stringify({
            hasToken: diagnostic.hasToken,
            tokenPreview: diagnostic.tokenPreview,
            loadingLoggedInUser: diagnostic.loadingLoggedInUser,
          }, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>LoggedInUser</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
          {JSON.stringify(diagnostic.LoggedInUser, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Slug Information</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
          {JSON.stringify({
            workspaceSlug: diagnostic.workspace.slug,
            activeSlug: diagnostic.activeSlug,
            defaultSlug,
          }, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Account Query</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
          {JSON.stringify({
            loading: diagnostic.queryLoading,
            error: diagnostic.queryError,
            account: diagnostic.account,
          }, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Full Diagnostic Data</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto', maxHeight: '400px' }}>
          {JSON.stringify(diagnostic, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '5px' }}>
        <h3>🔗 Quick Links</h3>
        <ul>
          <li><a href="/dashboard">Go to Dashboard</a></li>
          <li><a href="/signup/profile">Complete Profile</a></li>
          <li><a href="/signin">Sign In</a></li>
        </ul>
      </div>
    </div>
  );
}

