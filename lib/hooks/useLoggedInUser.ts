import React from 'react';

import { UserContext } from '../../components/UserProvider';

import type { LoggedInUser as LoggedInUserType } from '../custom_typings/LoggedInUser';

type UserContextProps = {
  errorLoggedInUser?: Error;
  loadingLoggedInUser: boolean;
  LoggedInUser: LoggedInUserType | null;
  login: () => void;
  logout: () => void;
  refetchLoggedInUser: () => void;
};

const useLoggedInUser = (): UserContextProps => React.useContext(UserContext);

export default useLoggedInUser;
