import React, { useState } from 'react';
import PropTypes from 'prop-types';

export const NewsAndUpdatesContext = React.createContext({
  showNewsAndUpdateModal: () => {},
});

const NewsAndUpdatesProvider = ({ children }) => {
  const [showNewsAndUpdates, setShowNewsAndUpdates] = useState(false);

  const context = {
    showNewsAndUpdates,
    setShowNewsAndUpdates,
  };

  return <NewsAndUpdatesContext.Provider value={context}>{children}</NewsAndUpdatesContext.Provider>;
};

NewsAndUpdatesProvider.propTypes = {
  children: PropTypes.node,
};

export const withNewsAndUpdates = WrappedComponent => {
  const WithNewsAndUpdates = props => (
    <NewsAndUpdatesContext.Consumer>
      {context => <WrappedComponent {...context} {...props} />}
    </NewsAndUpdatesContext.Consumer>
  );

  WithNewsAndUpdates.getInitialProps = WrappedComponent.getInitialProps;
  return WithNewsAndUpdates;
};

export default NewsAndUpdatesProvider;
