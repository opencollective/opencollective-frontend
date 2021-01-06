import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Container from '../../Container';
import ContributeCollective from '../../contribute-cards/ContributeCollective';
import { H2 } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';

/**
 * Connected collectives section for the About section category
 */
const SectionConnectedCollectives = ({ connectedCollectives }) => {
  if (!connectedCollectives?.length) {
    return null;
  }

  return (
    <ContainerSectionContent py={[3, 4]}>
      <Container width="100%" margin="0 auto">
        <H2 textAlign="center" fontSize="20px" lineHeight="28px" fontWeight="500" color="black.700" mb={4}>
          <FormattedMessage id="ConnectedCollectives" defaultMessage="Connected collectives" />
        </H2>
        <Container display="flex" flexWrap="wrap" justifyContent="space-evenly" py={2}>
          {connectedCollectives.map(({ id, collective }) => (
            <Container key={id} px={3}>
              <ContributeCollective collective={collective} />
            </Container>
          ))}
        </Container>
      </Container>
    </ContainerSectionContent>
  );
};

SectionConnectedCollectives.propTypes = {
  connectedCollectives: PropTypes.array,
};

export default React.memo(SectionConnectedCollectives);
