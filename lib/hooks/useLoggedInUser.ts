import React from 'react';

import { UserContext } from '../../components/UserProvider';

import type LoggedInUser from '../LoggedInUser';

export type UserContextProps = {
  errorLoggedInUser?: Error;
  loadingLoggedInUser: boolean;
  LoggedInUser: LoggedInUser | null;
  login: (token?: string) => Promise<LoggedInUser>;
  logout: (arg?: { redirect?: string; skipQueryRefetch?: boolean }) => Promise<void>;
  refetchLoggedInUser: () => Promise<void>;
};

const useLoggedInUser = (): UserContextProps => React.useContext(UserContext);

export default useLoggedInUser;
