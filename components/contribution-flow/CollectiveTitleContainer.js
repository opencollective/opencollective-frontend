import React from 'react';
import PropTypes from 'prop-types';

import { getCollectivePageRoute } from '../../lib/url-helpers';

import Container from '../Container';
import StyledLink from '../StyledLink';

const CollectiveTitleContainer = ({ collective, useLink, children, linkColor }) => {
  if (useLink) {
    return (
      <StyledLink href={getCollectivePageRoute(collective)} color={linkColor}>
        {children}
      </StyledLink>
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
