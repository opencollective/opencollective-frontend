import React from 'react';
import PropTypes from 'prop-types';

import NewsAndUpdatesModal from './NewsAndUpdatesModal';
import { useNewsAndUpdates } from './NewsAndUpdatesProvider';

const GlobalNewsAndUpdates = () => {
  const { showNewsAndUpdates, setShowNewsAndUpdates } = useNewsAndUpdates();
  return <NewsAndUpdatesModal open={showNewsAndUpdates} setOpen={open => setShowNewsAndUpdates(open)} />;
};

GlobalNewsAndUpdates.propTypes = {
  showNewsAndUpdates: PropTypes.bool,
  setShowNewsAndUpdates: PropTypes.func,
};

export default GlobalNewsAndUpdates;
