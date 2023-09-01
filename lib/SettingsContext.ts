import React from 'react';

export const SettingsContext = React.createContext<{
  settings: any;
  setSettings: (settings: any) => void;
}>({
  settings: {},
  setSettings: () => {},
});
