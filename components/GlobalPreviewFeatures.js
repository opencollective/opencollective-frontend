import React from 'react';
import PropTypes from 'prop-types';

import PreviewFeaturesModal from './PreviewFeaturesModal';
import { usePreviewFeatures } from './PreviewFeaturesProvider';

const GlobalPreviewFeatures = () => {
  const { showPreviewFeatures, setShowPreviewFeatures } = usePreviewFeatures();
  return <PreviewFeaturesModal open={showPreviewFeatures} setOpen={open => setShowPreviewFeatures(open)} />;
};

GlobalPreviewFeatures.propTypes = {
  showPreviewFeatures: PropTypes.bool,
  setShowPreviewFeatures: PropTypes.func,
};

export default GlobalPreviewFeatures;
