import React, { createContext, useContext } from 'react';
import type { ReactElement, ReactNode } from 'react';

import useLocalStorage from '../lib/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { useRouter } from 'next/router';
import { ALL_SECTIONS, ROOT_PROFILE_ACCOUNT, ROOT_PROFILE_KEY, ROOT_SECTIONS } from './dashboard/constants';
import { adminPanelQuery } from './dashboard/queries';
import { useQuery } from '@apollo/client';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import { isHostAccount } from '@/lib/collective';

type WorkspaceContextType = {
  workspace: { slug?: string; isHost?: boolean };
  setWorkspace: React.Dispatch<React.SetStateAction<{ slug?: string; isHost?: boolean }>>;
  selectedSection: string;
  subpath: string[];
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  account: any;
  activeSlug: string | null;
  defaultSlug: string | null;
  setDefaultSlug: (slug: string | null) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

interface WorkspaceProviderProps {
  children: ReactNode;
}

interface WorkspaceProviderProps {
  children: React.ReactNode;
}
function getSingleParam(queryParam: string | string[]): string {
  return Array.isArray(queryParam) ? queryParam[0] : queryParam;
}

function getAsArray(queryParam: string | string[]): string[] {
  return Array.isArray(queryParam) ? queryParam : [queryParam];
}

const parseQuery = query => {
  return {
    slug: getSingleParam(query.slug),
    section: getSingleParam(query.section),
    subpath: getAsArray(query.subpath)?.filter(Boolean),
  };
};

const getDefaultSectionForAccount = (account, loggedInUser) => {
  if (!account) {
    return null;
  } else if (account.type === 'ROOT') {
    return ROOT_SECTIONS.ALL_COLLECTIVES;
  } else if (loggedInUser?.isAccountantOnly(account) && isHostAccount(account)) {
    return ALL_SECTIONS.HOST_EXPENSES;
  } else if (loggedInUser?.isAccountantOnly(account)) {
    return ALL_SECTIONS.PAYMENT_RECEIPTS;
  } else {
    return ALL_SECTIONS.OVERVIEW;
  }
};

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps): ReactElement => {
  const [workspace, setWorkspace] = useLocalStorage<WorkspaceContextType['workspace']>(
    LOCAL_STORAGE_KEYS.DASHBOARD_NAVIGATION_STATE,
    {},
  );
  const router = useRouter();
  const { slug, section, subpath } = parseQuery(router.query);
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const isRootUser = LoggedInUser?.isRoot;
  const defaultSlug = workspace.slug || LoggedInUser?.collective.slug;
  const activeSlug = slug || defaultSlug;
  const isRootProfile = activeSlug === ROOT_PROFILE_KEY;

  const { data, loading } = useQuery(adminPanelQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: activeSlug },
    skip: !activeSlug || !LoggedInUser || isRootProfile,
  });
  const account = isRootProfile && isRootUser ? ROOT_PROFILE_ACCOUNT : data?.account;
  const selectedSection = section || getDefaultSectionForAccount(account, LoggedInUser);

  // Keep track of last visited workspace account and sections
  React.useEffect(() => {
    if (activeSlug && activeSlug !== workspace?.slug) {
      if (LoggedInUser) {
        setWorkspace({ slug: activeSlug });
      }
    }
    // If there is no slug set (that means /dashboard)
    // And if there is an activeSlug (this means workspace OR LoggedInUser)
    // And a LoggedInUser
    // And if activeSlug is different than LoggedInUser slug
    if (!slug && activeSlug && LoggedInUser && activeSlug !== LoggedInUser.collective.slug) {
      // router.replace(`/dashboard/${activeSlug}`);
    }
  }, [activeSlug, LoggedInUser]);

  // Clear last visited workspace account if not admin
  React.useEffect(() => {
    if (account && !LoggedInUser.isAdminOfCollective(account) && !(isRootProfile && isRootUser)) {
      setWorkspace({ slug: undefined });
    }
  }, [account]);
  const [expandedSection, setExpandedSection] = React.useState(null);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setWorkspace,
        selectedSection,
        subpath: subpath || [],
        expandedSection,
        setExpandedSection,
        account,
        activeSlug,
        defaultSlug,
        setDefaultSlug: slug => setWorkspace({ slug }),
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  return useContext(WorkspaceContext);
};
