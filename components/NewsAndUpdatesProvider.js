import React, { useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const NewsAndUpdatesContext = React.createContext({
  setShowNewsAndUpdates: () => {},
});

const NewsAndUpdatesProvider = ({ children }) => {
  const [showNewsAndUpdates, setShowNewsAndUpdates] = useState(false);

  const context = useMemo(
    () => ({
      showNewsAndUpdates,
      setShowNewsAndUpdates,
    }),
    [showNewsAndUpdates, setShowNewsAndUpdates],
  );

  return <NewsAndUpdatesContext.Provider value={context}>{children}</NewsAndUpdatesContext.Provider>;
};

NewsAndUpdatesProvider.propTypes = {
  children: PropTypes.node,
};

export const useNewsAndUpdates = () => {
  return useContext(NewsAndUpdatesContext);
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
