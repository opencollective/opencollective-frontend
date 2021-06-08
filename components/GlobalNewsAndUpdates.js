import React from 'react';
import PropTypes from 'prop-types';

import NewsAndUpdatesModal from './NewsAndUpdatesModal';
import { withNewsAndUpdates } from './NewsAndUpdatesProvider';

const GlobalNewsAndUpdates = props => {
  const { showNewsAndUpdates, setShowNewsAndUpdates } = props;
  return <NewsAndUpdatesModal show={showNewsAndUpdates} onClose={() => setShowNewsAndUpdates(false)} />;
};

GlobalNewsAndUpdates.propTypes = {
  showNewsAndUpdates: PropTypes.bool.isRequired,
  setShowNewsAndUpdates: PropTypes.func,
};

export default withNewsAndUpdates(GlobalNewsAndUpdates);
