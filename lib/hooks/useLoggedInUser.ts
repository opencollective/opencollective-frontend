import React from 'react';

import { UserContext } from '../../components/UserProvider';

import type { LoggedInUser as LoggedInUserType } from '../custom_typings/LoggedInUser';

export type UserContextProps = {
  errorLoggedInUser?: Error;
  loadingLoggedInUser: boolean;
  LoggedInUser: LoggedInUserType | null;
  login: (token?: string) => Promise<LoggedInUserType>;
  logout: (arg?: { redirect?: string; skipQueryRefetch?: boolean }) => Promise<void>;
  refetchLoggedInUser: () => Promise<void>;
};

const useLoggedInUser = (): UserContextProps => React.useContext(UserContext);

export default useLoggedInUser;
