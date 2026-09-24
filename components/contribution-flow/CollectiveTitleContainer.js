import React from 'react';

import { getCollectivePageRoute } from '../../lib/url-helpers';

import Container from '../Container';
import Link from '../Link';
import StyledLink from '../StyledLink';

const CollectiveTitleContainer = ({ collective, useLink, children, linkColor }) => {
  if (useLink) {
    return (
      <StyledLink as={Link} href={getCollectivePageRoute(collective)} color={linkColor}>
        {children}
      </StyledLink>
    );
  } else {
    return <Container>{children}</Container>;
  }
};

export default CollectiveTitleContainer;
