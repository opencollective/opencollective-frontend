import React from 'react';

export const NavigationHistoryContext = React.createContext([]);

export const useNavigationHistory = () => React.useContext(NavigationHistoryContext);
