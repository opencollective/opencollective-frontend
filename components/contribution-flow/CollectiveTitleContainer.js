import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Container from '../Container';
import Link from '../Link';

const CollectiveTitleLink = styled(Link)`
  color: ${props => props.linkColor};
  cursor: pointer;
`;

const CollectiveTitleContainer = ({ collective, useLink, children, linkColor }) => {
  if (useLink) {
    return (
      <CollectiveTitleLink href={`/${collective.slug}`} linkColor={linkColor}>
        {children}
      </CollectiveTitleLink>
    );
  } else {
    return <Container>{children}</Container>;
  }
};

CollectiveTitleContainer.propTypes = {
  collective: PropTypes.object,
  useLink: PropTypes.bool,
  children: PropTypes.node,
  linkColor: PropTypes.string,
};

export default CollectiveTitleContainer;
