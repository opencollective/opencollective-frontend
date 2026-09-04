import React, { Fragment } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { color } from 'styled-system';

import Header from '../components/Header';

const GlobalStyles = createGlobalStyle`
  body {
    overflow-y: auto;
  }
  body > div:first-child {
    height: 100%;
  }
`;

const Main = styled.main`
  margin: 0;
  padding: 0;
  height: 100%;
  ${color}
`;

/**
 * A special component to render embedded pages, that makes sure we add the "no-robot" meta
 * and that the footer/topbar will not be displayed, while preserving the normal DOM structure
 * and meta.
 */
const EmbeddedPage = ({
  children,
  description = undefined,
  title = undefined,
  canonicalURL = undefined,
  collective = undefined,
  backgroundColor = undefined,
}) => {
  return (
    <Fragment>
      <GlobalStyles />
      <Header
        title={title}
        description={description}
        canonicalURL={canonicalURL}
        collective={collective}
        withTopBar={false}
        noRobots
      />
      <Main backgroundColor={backgroundColor}>{children}</Main>
    </Fragment>
  );
};

export default EmbeddedPage;
