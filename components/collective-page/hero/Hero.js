import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Flex } from '@rebass/grid';
import styled from 'styled-components';
import { get } from 'lodash';
import dynamic from 'next/dynamic';

// Icons
import { Twitter } from '@styled-icons/feather/Twitter';
import { Github } from '@styled-icons/feather/Github';
import { Camera } from '@styled-icons/feather/Camera';
import { Palette } from '@styled-icons/boxicons-regular/Palette';
import { Globe } from '@styled-icons/feather/Globe';

// General project imports
import { CollectiveType } from '../../../lib/constants/collectives';
import { getCollectiveMainTag } from '../../../lib/collective.lib';
import { twitterProfileUrl, githubProfileUrl } from '../../../lib/url_helpers';
import StyledRoundButton from '../../StyledRoundButton';
import StyledLink from '../../StyledLink';
import ExternalLink from '../../ExternalLink';
import { Span, H1 } from '../../Text';
import Container from '../../Container';
import I18nCollectiveTags from '../../I18nCollectiveTags';
import StyledTag from '../../StyledTag';
import DefinedTerm, { Terms } from '../../DefinedTerm';
import LinkCollective from '../../LinkCollective';
import CollectiveCallsToAction from '../../CollectiveCallsToAction';
import UserCompany from '../../UserCompany';
import StyledButton from '../../StyledButton';

// Local imports
import ContainerSectionContent from '../ContainerSectionContent';
import HeroBackground from './HeroBackground';
import HeroTotalCollectiveContributionsWithData from './HeroTotalCollectiveContributionsWithData';
import CollectiveColorPicker from './CollectiveColorPicker';
import HeroAvatar from './HeroAvatar';
import MessageBox from '../../MessageBox';

// Dynamic imports
const HeroEventDetails = dynamic(() => import('./HeroEventDetails'));

const Translations = defineMessages({
  website: {
    id: 'collective.website.label',
    defaultMessage: 'Website',
  },
});

const StyledShortDescription = styled.h2`
  margin-top: 8px;
  font-size: ${props => props.theme.fontSizes.LeadParagraph}px;
  line-height: 24px;

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
const Hero = ({ collective, host, isAdmin, onPrimaryColorChange, callsToAction, intl }) => {
  const [hasColorPicker, showColorPicker] = React.useState(false);
  const [isEditingCover, editCover] = React.useState(false);
  const [message, showMessage] = React.useState(null);
  const isEditing = hasColorPicker || isEditingCover;
  const isCollective = collective.type === CollectiveType.COLLECTIVE;
  const isEvent = collective.type === CollectiveType.EVENT;

  const handleHeroMessage = msg => {
    if (!msg) {
      showMessage(null);
    } else {
      showMessage({
        type: msg.type || 'info',
        content: msg.content || msg,
      });
    }
  };

  return (
    <Fragment>
      {message && (
        <MessageBox type={message.type} withIcon={true}>
          {message.content}
        </MessageBox>
      )}
      <Container position="relative" minHeight={325} zIndex={1000} data-cy="collective-hero">
        <HeroBackground collective={collective} isEditing={isEditingCover} onEditCancel={() => editCover(false)} />
        {isAdmin && !isEditing && (
          // We don't have any mobile view for this one yet
          <Container
            data-cy="edit-collective-display-features"
            display={['none', null, null, 'block']}
            position="absolute"
            right={25}
            top={25}
            zIndex={222}
          >
            <StyledButton data-cy="edit-cover-btn" onClick={() => editCover(true)}>
              <Span mr={2}>
                <Camera size="1.2em" />
              </Span>
              <FormattedMessage id="Hero.EditCover" defaultMessage="Edit cover" />
            </StyledButton>
            <StyledButton data-cy="edit-main-color-btn" ml={3} onClick={() => showColorPicker(true)}>
              <Span mr={2}>
                <Palette size="1.2em" />
              </Span>
              <FormattedMessage id="Hero.EditColor" defaultMessage="Edit main color" />
            </StyledButton>
          </Container>
        )}
        {hasColorPicker && (
          <Container position="fixed" right={25} top={72} zIndex={99999}>
            <CollectiveColorPicker
              collective={collective}
              onChange={onPrimaryColorChange}
              onClose={() => showColorPicker(false)}
            />
          </Container>
        )}
        <ContainerSectionContent pt={40} display="flex" flexDirection="column">
          {/* Collective presentation (name, logo, description...) */}
          <Container position="relative" mb={2} width={128}>
            <HeroAvatar collective={collective} isAdmin={isAdmin} handleHeroMessage={handleHeroMessage} />
          </Container>
          <H1 color="black.800" fontSize="H3" lineHeight="H3" textAlign="left" data-cy="collective-title">
            {collective.name || collective.slug}
          </H1>

          {collective.company && (
            <StyledLink as={UserCompany} fontSize="H5" fontWeight={600} company={collective.company} />
          )}
          {!isEvent && (
            <Flex alignItems="center" flexWrap="wrap">
              {isCollective && (
                <StyledTag mx={2} my={2} mb={2}>
                  <I18nCollectiveTags
                    tags={getCollectiveMainTag(get(collective, 'host.id'), collective.tags, collective.type)}
                  />
                </StyledTag>
              )}
              <Flex my={2}>
                {collective.twitterHandle && (
                  <ExternalLink
                    data-cy="twitterProfileUrl"
                    href={twitterProfileUrl(collective.twitterHandle)}
                    title="Twitter"
                    aria-label="Twitter link"
                    openInNewTab
                  >
                    <StyledRoundButton size={32} mr={3}>
                      <Twitter size={12} />
                    </StyledRoundButton>
                  </ExternalLink>
                )}
                {collective.githubHandle && (
                  <ExternalLink
                    data-cy="githubProfileUrl"
                    href={githubProfileUrl(collective.githubHandle)}
                    title="Github"
                    openInNewTab
                    aria-label="Github link"
                  >
                    <StyledRoundButton size={32} mr={3}>
                      <Github size={12} />
                    </StyledRoundButton>
                  </ExternalLink>
                )}
                {collective.website && (
                  <ExternalLink
                    data-cy="collectiveWebsite"
                    href={collective.website}
                    title={intl.formatMessage(Translations.website)}
                    aria-label="Website link"
                    openInNewTab
                  >
                    <StyledRoundButton size={32} mr={3}>
                      <Globe size={14} />
                    </StyledRoundButton>
                  </ExternalLink>
                )}
              </Flex>
              {host && collective.isApproved && !isEvent && (
                <Container mx={1} color="#969ba3" my={2}>
                  <FormattedMessage
                    id="Collective.Hero.Host"
                    defaultMessage="{FiscalHost}: {hostName}"
                    values={{
                      FiscalHost: <DefinedTerm term={Terms.FISCAL_HOST} />,
                      hostName: (
                        <LinkCollective collective={host}>
                          <Span data-cy="fiscalHostName" color="black.600">
                            {host.name}
                          </Span>
                        </LinkCollective>
                      ),
                    }}
                  />
                </Container>
              )}
              {collective.canApply && (
                <Fragment>
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
                </Fragment>
              )}
            </Flex>
          )}
          <StyledShortDescription>{collective.description}</StyledShortDescription>
          {isEvent && <HeroEventDetails collective={collective} />}

          {!isCollective && !isEvent && !collective.isHost && (
            <HeroTotalCollectiveContributionsWithData collective={collective} />
          )}
          {/** Calls to actions - only displayed on mobile because NavBar has its own instance on tablet+ */}
          <CollectiveCallsToAction
            display={['flex', null, 'none']}
            flexWrap="wrap"
            mt={3}
            width="100%"
            collective={collective}
            callsToAction={callsToAction}
            buttonsMinWidth={140}
          />
        </ContainerSectionContent>
      </Container>
    </Fragment>
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
    isApproved: PropTypes.bool,
    canApply: PropTypes.bool,
    backgroundImage: PropTypes.string,
    backgroundImageUrl: PropTypes.string,
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

  /** Show the color picker input */
  onPrimaryColorChange: PropTypes.func.isRequired,

  /** Defines which buttons get displayed. See `CollectiveCallsToAction` */
  callsToAction: PropTypes.object,

  /** Define if we need to display special actions like the "Edit collective" button */
  isAdmin: PropTypes.bool,

  /** @ignore */
  intl: PropTypes.object,
};

export default React.memo(injectIntl(Hero));
