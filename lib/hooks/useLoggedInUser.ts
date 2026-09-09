import React from 'react';

import type { UserContextValue } from '../../components/UserProvider';
import { UserContext } from '../../components/UserProvider';

const useLoggedInUser = (): UserContextValue => React.useContext(UserContext);

export default useLoggedInUser;
