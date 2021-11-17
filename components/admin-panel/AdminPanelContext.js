import React from 'react';

import { ALL_SECTIONS } from './constants';

export const AdminPanelContext = React.createContext({
  selectedSection: ALL_SECTIONS.INFO,
});
