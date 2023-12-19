import React, { useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

export const PreviewFeaturesContext = React.createContext({
  setShowPreviewFeatures: () => {},
});

const PreviewFeaturesProvider = ({ children }) => {
  const [showPreviewFeatures, setShowPreviewFeatures] = useState(false);

  const context = useMemo(
    () => ({
      showPreviewFeatures,
      setShowPreviewFeatures,
    }),
    [showPreviewFeatures, setShowPreviewFeatures],
  );

  return <PreviewFeaturesContext.Provider value={context}>{children}</PreviewFeaturesContext.Provider>;
};

PreviewFeaturesProvider.propTypes = {
  children: PropTypes.node,
};

export const usePreviewFeatures = () => {
  return useContext(PreviewFeaturesContext);
};

export const withPreviewFeatures = WrappedComponent => {
  const WithPreviewFeatures = props => (
    <PreviewFeaturesContext.Consumer>
      {context => <WrappedComponent {...context} {...props} />}
    </PreviewFeaturesContext.Consumer>
  );

  WithPreviewFeatures.getInitialProps = WrappedComponent.getInitialProps;
  return WithPreviewFeatures;
};

export default PreviewFeaturesProvider;
