import React, { useContext, useState } from 'react';

type NewsAndUpdatesContextValue = {
  showNewsAndUpdates?: boolean;
  setShowNewsAndUpdates: React.Dispatch<React.SetStateAction<boolean>>;
};

const NewsAndUpdatesContext = React.createContext<NewsAndUpdatesContextValue>({
  setShowNewsAndUpdates: () => {},
});

const NewsAndUpdatesProvider = ({ children }) => {
  const [showNewsAndUpdates, setShowNewsAndUpdates] = useState(false);

  const context = {
    showNewsAndUpdates,
    setShowNewsAndUpdates,
  };

  return <NewsAndUpdatesContext.Provider value={context}>{children}</NewsAndUpdatesContext.Provider>;
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
