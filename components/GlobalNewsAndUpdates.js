import React from 'react';

import NewsAndUpdatesModal from './NewsAndUpdatesModal';
import { useNewsAndUpdates } from './NewsAndUpdatesProvider';

const GlobalNewsAndUpdates = () => {
  const { showNewsAndUpdates, setShowNewsAndUpdates } = useNewsAndUpdates();
  return <NewsAndUpdatesModal open={showNewsAndUpdates} setOpen={open => setShowNewsAndUpdates(open)} />;
};

export default GlobalNewsAndUpdates;
