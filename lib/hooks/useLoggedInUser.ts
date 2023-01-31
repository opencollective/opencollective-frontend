import React from 'react';

import { UserContext } from '../../components/UserProvider';

import type { LoggedInUser as LoggedInUserType } from '../custom_typings/LoggedInUser';

type UserContextProps = {
  loadingLoggedInUser: boolean;
  errorLoggedInUser?: Error;
  LoggedInUser: LoggedInUserType | null;
  logout: () => void;
  login: () => void;
  refetchLoggedInUser: () => void;
};

const useLoggedInUser = (): UserContextProps => React.useContext(UserContext);

export default useLoggedInUser;
