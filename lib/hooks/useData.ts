import { useApolloClient } from '@apollo/client';

import { useTwoFactorAuthentication } from '../two-factor-authentication/TwoFactorAuthenticationContext';

type useDataType = (props: { serverState?: { apollo?: { data?: any } } }) => {
  client: ReturnType<typeof useApolloClient>;
  twoFactorAuthContext: any;
};

const useData: useDataType = props => {
  const twoFactorAuthContext = useTwoFactorAuthentication();
  const client = useApolloClient();
  if (props.serverState?.apollo) {
    client.cache.restore(props.serverState.apollo.data);
  }

  return { client, twoFactorAuthContext };
};

export default useData;
