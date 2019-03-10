import React from 'react';
import PropTypes from 'prop-types';

import { H2, P } from './Text';
import Container from './Container';
import StyledButton from './StyledButton';

const ArchiveCollective = ({ collective }) => {
  const collectiveType = collective.type === 'ORGANIZATION' ? 'Organization' : 'Collective';

  return (
    <Container>
      <H2>Archive this {collectiveType}.</H2>
      <P>Mark this {collectiveType.toLocaleLowerCase()} as archived, delete all tiers and cancel all subscriptions.</P>
      <StyledButton>Archive this {collectiveType.toLocaleLowerCase()}</StyledButton>
    </Container>
  );
};

ArchiveCollective.propTypes = {
  collective: PropTypes.object.isRequired,
};

export default ArchiveCollective;
