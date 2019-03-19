import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { themeGet } from 'styled-system';
import { ExternalLinkAlt } from 'styled-icons/fa-solid/ExternalLinkAlt';

import { Link } from '../server/pages';
import StyledCard from './StyledCard';
import styled from 'styled-components';

import Header from './Header';
import Body from './Body';
// import Footer from './Footer';
import Container from './Container';
import { Box, Flex } from '@rebass/grid';
import { H5 } from './Text';
// import PledgeCard from './PledgeCard';
import StyledLink from './StyledLink';
// import Currency from './Currency';

const defaultPledgedLogo = '/static/images/default-pledged-logo.svg';

const MainContainer = styled(StyledCard)`
  width: 144px;

  a {
    display: block;
    text-decoration: none;
    &:hover {
      opacity: 0.8;
    }
  }
`;

const CollectiveLogoContainer = styled(Flex)`
  border-top: 1px solid ${themeGet('colors.black.200')};
  justify-content: center;
`;

const TruncatedText = styled(Container)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

class PledgedCollectiveCard extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      currency: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
    LoggedInUser: PropTypes.object,
  };

  render() {
    const { LoggedInUser, collective } = this.props;

    let website = collective.website;
    if (!website && collective.githubHandle) {
      website = `https://github.com/${collective.githubHandle}`;
    }

    return (
      <Body>
        <Header LoggedInUser={LoggedInUser} />
        <Body>
          <MainContainer>
            <CollectiveLogoContainer mt={52} mb={2}>
              <Box mt={-32}>
                <Link route="collective" params={{ slug: collective.slug }}>
                  <img src={defaultPledgedLogo} alt="Pledged Collective" radius={32} />
                </Link>
              </Box>
            </CollectiveLogoContainer>
            <Flex flexDirection="column" alignItems="center" p={2}>
              <Link route="collective" params={{ slug: collective.slug }}>
                <H5 fontSize="Paragraph" fontWeight="bold" lineHeight="Caption">
                  {collective.name}
                </H5>
              </Link>
              <TruncatedText minHeight={15} fontSize="Tiny" textAlign="center" color="black.500">
                <FormattedMessage id="Pledgecollective.card" defaultMessage="PLEDGED COLLECTIVES" />
              </TruncatedText>
              <StyledLink href={website} color="primary.700" fontSize="Caption">
                <ExternalLinkAlt size="2em" /> {website}
              </StyledLink>
              <Link route="createCollectivePledge" params={{ slug: collective.slug }} passHref>
                <StyledLink buttonStyle="primary" mb={4} mx="auto" buttonSize="small">
                  <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
                </StyledLink>
              </Link>
              <Link route="claimCollective" params={{ collectiveSlug: collective.slug }} passHref>
                <StyledLink textAlign="center" mb={4} mx="auto" buttonSize="small" buttonStyle="standard">
                  <FormattedMessage id="pledge.claim" defaultMessage="Claim this collective" />
                </StyledLink>
              </Link>
            </Flex>
          </MainContainer>
        </Body>
      </Body>
    );
  }
}

export default PledgedCollectiveCard;
