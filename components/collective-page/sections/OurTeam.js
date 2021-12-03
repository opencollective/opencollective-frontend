import React from 'react';
import PropTypes from 'prop-types';
import { Mail } from '@styled-icons/feather/Mail';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import ContactCollectiveModal from '../../ContactCollectiveModal';
import Container from '../../Container';
import ContributorCard from '../../ContributorCard';
import StyledButton from '../../StyledButton';
import { H2, Span } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';

const COLLECTIVE_CARD_WIDTH = 144;

/**
 * Our Team section for the About section category
 */
const SectionOurTeam = ({ collective, coreContributors, LoggedInUser }) => {
  const loggedUserCollectiveId = get(LoggedInUser, 'CollectiveId');
  const [showContactModal, setShowContactModal] = React.useState(false);

  return (
    <ContainerSectionContent py={[3, 4]}>
      <Container width="100%" maxWidth={700} margin="0 auto">
        <H2 textAlign="center" fontSize="20px" lineHeight="28px" fontWeight="500" color="black.700" mb={4}>
          <FormattedMessage id="OurTeam" defaultMessage="Our team" />
        </H2>
        <Container display="flex" flexWrap="wrap" justifyContent="space-evenly" py={2}>
          {coreContributors.map(contributor => (
            <ContributorCard
              key={contributor.id}
              m={2}
              width={COLLECTIVE_CARD_WIDTH}
              height="auto"
              contributor={contributor}
              currency={collective.currency}
              collectiveId={collective.id}
              isLoggedUser={loggedUserCollectiveId === contributor.collectiveId}
              hideTotalAmountDonated
            />
          ))}
        </Container>
        {collective.canContact && LoggedInUser && (
          <Container display="flex" flexDirection="column" alignItems="center">
            <StyledButton
              onClick={() => setShowContactModal(true)}
              buttonType="button"
              buttonStyle="secondary"
              mt={[3, 4]}
            >
              <Span mr="8px">
                <Mail size={16} />
              </Span>
              <FormattedMessage defaultMessage="Contact Collective" />
            </StyledButton>
          </Container>
        )}
      </Container>
      <ContactCollectiveModal
        show={showContactModal}
        collective={collective}
        onClose={() => setShowContactModal(false)}
      />
    </ContainerSectionContent>
  );
};

SectionOurTeam.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    currency: PropTypes.string,
    parentCollective: PropTypes.shape({
      coreContributors: PropTypes.array.isRequired,
    }),
    canContact: PropTypes.bool,
  }).isRequired,

  coreContributors: PropTypes.array.isRequired,

  LoggedInUser: PropTypes.object,
};

export default React.memo(SectionOurTeam);
