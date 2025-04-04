import { createContext, useContext } from 'react';

import { type WhitelabelProps } from '../whitelabel';

export const WhitelabelProviderContext = createContext<WhitelabelProps['provider']>(null);

const useWhitelabelProvider = () => useContext(WhitelabelProviderContext);

export default useWhitelabelProvider;
