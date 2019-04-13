import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { ExternalLinkAlt } from 'styled-icons/fa-solid/ExternalLinkAlt';
import { get } from 'lodash';

// import { defaultImage, defaultBackgroundImage } from '../constants/collectives';

// import { imagePreview } from '../lib/utils';

import { Flex, Box } from '@rebass/grid';
import Container from './Container';
import { P } from './Text';
import { Link } from '../server/pages';
import StyledLink from './StyledLink';
import { themeGet } from 'styled-system';
import Currency from './Currency';

const defaultPledgedLogo = '/static/images/default-collective-logo.svg';

const CollectiveLogoContainer = styled(Flex)`
  justify-content: center;
  border-top: 1px solid ${themeGet('colors.black.300')};
`;

class PledgeCollectiveCard extends React.Component {
  static propTypes = {
    membership: PropTypes.object,
    LoggedInUser: PropTypes.object,
    collective: PropTypes.shape({
      backgroundImage: PropTypes.string,
      description: PropTypes.string,
      image: PropTypes.string,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      currency: PropTypes.string.isRequired,
    }).isRequired,
    backers: PropTypes.shape({
      totalAmount: PropTypes.number,
    }),
  };

  render() {
    const { collective } = this.props;

    let website = collective.website;
    if (!website && collective.githubHandle) {
      website = `https://github.com/${collective.githubHandle}`;
    }

    return (
      <Container
        bg="white"
        borderRadius="8px"
        border="1px solid rgba(18,19,20,0.2)"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        minHeight="100%"
        overflow="hidden"
      >
        <CollectiveLogoContainer mt={52}>
          <Box mt={-50}>
            <Link route="collective" params={{ slug: collective.slug }}>
              <img src={defaultPledgedLogo} alt="Pledged Collective" radius={8} width="94px" mb={-43} />
            </Link>
          </Box>
        </CollectiveLogoContainer>

        <P fontSize="1.4rem" textAlign="center" fontWeight="bold" mb={-1} color="black.600">
          <Link route="collective" params={{ slug: collective.slug }} color="black.600">
            {collective.name}
          </Link>
        </P>

        <P fontSize="1.2rem" textAlign="center" p={1}>
          <FormattedMessage id="Pledgecollective.card" defaultMessage="PLEDGED COLLECTIVES" />
        </P>
        <Link route="createCollectivePledge" params={{ slug: collective.slug }} passHref>
          <StyledLink href={website} color="primary.500" fontSize="Caption">
            <ExternalLinkAlt size="1em" /> {website}
          </StyledLink>
        </Link>
        <Link route="createCollectivePledge" params={{ slug: collective.slug }} passHref>
          <StyledLink buttonStyle="primary" mb={4} mx="auto" buttonSize="small">
            <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
          </StyledLink>
        </Link>
        <Link route="claimCollective" params={{ collectiveSlug: collective.slug }} passHref>
          <StyledLink textAlign="center" width={1} mb={4} buttonSize="small" buttonStyle="standard">
            <FormattedMessage id="pledge.claim" defaultMessage="Claim this collective" />
          </StyledLink>
        </Link>
        <Container display="flex" borderTop="1px solid #E3E4E6" py={2} mt={3}>
          {collective.isActive && get(collective, 'stats.backers.all') > 0 && (
            <Flex width={0.5} alignItems="center" flexDirection="column" key="backers">
              <P fontSize="1.2rem" fontWeight="bold">
                {collective.stats.backers.all}
              </P>
              <P fontSize="1.2rem">
                <FormattedMessage
                  id="collective.card.stats.backers"
                  defaultMessage="{n, plural, one {backer} other {backers}}"
                  values={{ n: collective.stats.backers.all }}
                />
              </P>
              <Flex width={0.5} alignItems="center" flexDirection="column" key="total amount">
                <P fontSize="1.2rem" fontWeight="bold">
                  <Currency value={collective.stats.totalAmount} currency={collective.currency} />
                </P>
                <P fontSize="1.2rem">
                  <FormattedMessage id="collective.card.stats.totalAmount" defaultMessage={'total amount'} />
                </P>
              </Flex>
            </Flex>
          )}
        </Container>
      </Container>
    );
  }
}

export default PledgeCollectiveCard;
