import React from 'react';
import PropTypes from 'prop-types';

import Container from '../Container';
import Link from '../Link';
import StyledLink from '../StyledLink';

const CollectiveTitleContainer = ({ collective, useLink, children, linkColor }) => {
  if (useLink) {
    return (
      <StyledLink as={Link} href={`/${collective.slug}`} color={linkColor}>
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
