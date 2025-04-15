import React, { createContext, useContext } from 'react';
import type { ReactElement, ReactNode } from 'react';

import useLocalStorage from '../lib/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '../lib/local-storage';

type WorkspaceContextType = {
  workspace: { slug?: string };
  setWorkspace: React.Dispatch<React.SetStateAction<{ slug?: string }>>;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

interface WorkspaceProviderProps {
  children: ReactNode;
}

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export const WorkspaceProvider = ({
  children
}: WorkspaceProviderProps): ReactElement => {
  const [workspace, setWorkspace] = useLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_NAVIGATION_STATE, {});

  return <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = (): WorkspaceContextType => {
  return useContext(WorkspaceContext);
};
