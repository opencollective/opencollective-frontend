import React from 'react';
import PropTypes from 'prop-types';

import NewsAndUpdatesModal from './NewsAndUpdatesModal';
import { useNewsAndUpdates } from './NewsAndUpdatesProvider';

const GlobalNewsAndUpdates = () => {
  const { showNewsAndUpdates, setShowNewsAndUpdates } = useNewsAndUpdates();
  return <NewsAndUpdatesModal show={showNewsAndUpdates} onClose={() => setShowNewsAndUpdates(false)} />;
};

GlobalNewsAndUpdates.propTypes = {
  showNewsAndUpdates: PropTypes.bool.isRequired,
  setShowNewsAndUpdates: PropTypes.func,
};

export default GlobalNewsAndUpdates;
