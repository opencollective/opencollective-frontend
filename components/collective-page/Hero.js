import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Flex } from '@rebass/grid';
import styled from 'styled-components';
import { get } from 'lodash';

// Icons
import { Twitter } from 'styled-icons/feather/Twitter';
import { Github } from 'styled-icons/feather/Github';
import { ExternalLink } from 'styled-icons/feather/ExternalLink';
import { Cog } from 'styled-icons/typicons/Cog';

// General project imports
import { CollectiveType } from '../../lib/constants/collectives';
import { getCollectiveMainTag } from '../../lib/collective.lib';
import { twitterProfileUrl, githubProfileUrl } from '../../lib/url_helpers';
import StyledRoundButton from '../StyledRoundButton';
import StyledLink from '../StyledLink';
import ExternalLinkNewTab from '../ExternalLinkNewTab';
import { Span, H1 } from '../Text';
import Container from '../Container';
import Avatar from '../Avatar';
import I18nCollectiveTags from '../I18nCollectiveTags';
import StyledTag from '../StyledTag';
import DefinedTerm, { Terms } from '../DefinedTerm';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import CollectiveCallsToAction from '../CollectiveCallsToAction';
import UserCompany from '../UserCompany';

// Local imports
import ContainerSectionContent from './ContainerSectionContent';
import HeroBackground from './HeroBackground';
import HeroTotalCollectiveContributionsWithData from './HeroTotalCollectiveContributionsWithData';

const Translations = defineMessages({
  website: {
    id: 'collective.website.label',
    defaultMessage: 'Website',
  },
  settings: {
    id: 'collective.settings',
    defaultMessage: 'Settings',
  },
});

const StyledShortDescription = styled.h2`
  margin-top: 8px;
  font-size: ${props => props.theme.fontSizes.LeadParagraph}px;
  line-height: 24px;
  text-align: center;

  @media (min-width: 40em) {
    text-align: left;
  }

  @media (min-width: 64em) {
    max-width: 600px;
  }

  @media (min-width: 88em) {
    max-width: 750px;
  }
`;

/**
 * Collective's page Hero/Banner/Cover component.
 */
const Hero = ({ collective, host, isAdmin, onCollectiveClick, intl }) => {
  const isCollective = collective.type === CollectiveType.COLLECTIVE;
  const hasContact = (isCollective || collective.isHost) && !isAdmin;
  const hasDashboard = collective.isHost && isAdmin;

  return (
    <Container position="relative" minHeight={325} zIndex={1000}>
      <HeroBackground backgroundImage={collective.backgroundImage} />
      <ContainerSectionContent pt={40} display="flex" flexDirection="column" alignItems={['center', 'flex-start']}>
        {/* Collective presentation (name, logo, description...) */}
        <Flex flexDirection={'column'} alignItems={['center', 'flex-start']}>
          <Container position="relative" display="flex" justifyContent={['center', 'flex-start']}>
            <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
              <Container background="rgba(245, 245, 245, 0.5)" borderRadius="25%">
                <Avatar collective={collective} radius={128} />
              </Container>
            </LinkCollective>
            {isAdmin && (
              <Container position="absolute" right={-10} bottom={-5} color="#4B4E52">
                <Link
                  route="editCollective"
                  params={{ slug: collective.slug }}
                  title={intl.formatMessage(Translations.settings)}
                >
                  <StyledRoundButton size={40} bg="#F0F2F5">
                    <Cog size={24} />
                  </StyledRoundButton>
                </Link>
              </Container>
            )}
          </Container>
          <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
            <H1 color="black.800" fontSize={'H3'} lineHeight={'H3'} textAlign={['center', 'left']}>
              {collective.name || collective.slug}
            </H1>
          </LinkCollective>
        </Flex>

        {collective.company && (
          <StyledLink as={UserCompany} fontSize="H5" fontWeight={600} company={collective.company} />
        )}

        <Flex alignItems="center" justifyContent={['center', 'left']} flexWrap="wrap">
          {isCollective && (
            <StyledTag mx={2} my={2} mb={2}>
              <I18nCollectiveTags tags={getCollectiveMainTag(get(collective, 'host.id'), collective.tags)} />
            </StyledTag>
          )}
          <Flex my={2}>
            {collective.twitterHandle && (
              <ExternalLinkNewTab href={twitterProfileUrl(collective.twitterHandle)} title="Twitter">
                <StyledRoundButton size={32} mr={3}>
                  <Twitter size={12} />
                </StyledRoundButton>
              </ExternalLinkNewTab>
            )}
            {collective.githubHandle && (
              <ExternalLinkNewTab href={githubProfileUrl(collective.githubHandle)} title="Github">
                <StyledRoundButton size={32} mr={3}>
                  <Github size={12} />
                </StyledRoundButton>
              </ExternalLinkNewTab>
            )}
            {collective.website && (
              <ExternalLinkNewTab href={collective.website} title={intl.formatMessage(Translations.website)}>
                <StyledRoundButton size={32} mr={3}>
                  <ExternalLink size={12} />
                </StyledRoundButton>
              </ExternalLinkNewTab>
            )}
          </Flex>
          {host && (
            <Container mx={1} color="#969ba3" my={2}>
              <FormattedMessage
                id="Collective.Hero.Host"
                defaultMessage="{FiscalHost}: {hostName}"
                values={{
                  FiscalHost: <DefinedTerm term={Terms.FISCAL_HOST} />,
                  hostName: (
                    <LinkCollective collective={host}>
                      <Span color="black.600">{host.name}</Span>
                    </LinkCollective>
                  ),
                }}
              />
            </Container>
          )}
          {collective.isHost && (
            <React.Fragment>
              {collective.settings.tos && (
                <StyledLink
                  target="_blank"
                  rel="noopener noreferrer"
                  href={collective.settings.tos}
                  borderBottom="2px dotted #969ba3"
                  color="black.700"
                  textDecoration="none"
                  fontSize="Caption"
                  mr={2}
                >
                  <FormattedMessage id="host.tos" defaultMessage="Terms of fiscal sponsorship" />
                </StyledLink>
              )}
              <Container ml={2} mr={3} color="black.500" fontSize="Caption">
                <FormattedMessage
                  id="Hero.HostFee"
                  defaultMessage="Host fee: {fee}"
                  values={{
                    fee: (
                      <DefinedTerm term={Terms.HOST_FEE} color="black.700">
                        {collective.hostFeePercent || 0}%
                      </DefinedTerm>
                    ),
                  }}
                />
              </Container>
            </React.Fragment>
          )}
        </Flex>
        <StyledShortDescription>{collective.description}</StyledShortDescription>
        {!isCollective && !collective.isHost && <HeroTotalCollectiveContributionsWithData collective={collective} />}
        {/** Calls to actions - only displayed on mobile because NavBar has its own instance on tablet+ */}
        <CollectiveCallsToAction
          display={['flex', 'none']}
          mt={3}
          collective={collective}
          hasContact={hasContact}
          hasDashboard={hasDashboard}
        />
      </ContainerSectionContent>
    </Container>
  );
};

Hero.propTypes = {
  /** The collective to display */
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    company: PropTypes.string,
    backgroundImage: PropTypes.string,
    twitterHandle: PropTypes.string,
    githubHandle: PropTypes.string,
    website: PropTypes.string,
    description: PropTypes.string,
    isHost: PropTypes.bool,
    hostFeePercent: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    settings: PropTypes.shape({
      tos: PropTypes.string,
    }).isRequired,
  }).isRequired,

  /** Collective's host */
  host: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
  }),

  /** When users click on avatar or collective name */
  onCollectiveClick: PropTypes.func.isRequired,

  /** Define if we need to display special actions like the "Edit collective" button */
  isAdmin: PropTypes.bool,

  /** @ignore */
  intl: PropTypes.object,
};

export default React.memo(injectIntl(Hero));
