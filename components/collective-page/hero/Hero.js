import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Palette } from '@styled-icons/boxicons-regular/Palette';
import { Camera } from '@styled-icons/feather/Camera';
import { Github } from '@styled-icons/feather/Github';
import { Globe } from '@styled-icons/feather/Globe';
import { Settings } from '@styled-icons/feather/Settings';
import { Twitter } from '@styled-icons/feather/Twitter';
import { get } from 'lodash';
import dynamic from 'next/dynamic';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { getCollectiveMainTag } from '../../../lib/collective.lib';
import { CollectiveType } from '../../../lib/constants/collectives';
import { githubProfileUrl, twitterProfileUrl } from '../../../lib/url_helpers';

import Container from '../../Container';
import DefinedTerm, { Terms } from '../../DefinedTerm';
import { Box, Flex } from '../../Grid';
import I18nCollectiveTags from '../../I18nCollectiveTags';
import Link from '../../Link';
import LinkCollective from '../../LinkCollective';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledLink from '../../StyledLink';
import StyledRoundButton from '../../StyledRoundButton';
import StyledTag from '../../StyledTag';
import { H1, Span } from '../../Text';
import UserCompany from '../../UserCompany';
import ContainerSectionContent from '../ContainerSectionContent';

import CollectiveColorPicker from './CollectiveColorPicker';
import HeroAvatar from './HeroAvatar';
import HeroBackground, { BASE_HERO_HEIGHT, StyledHeroBackground } from './HeroBackground';
import HeroTotalCollectiveContributionsWithData from './HeroTotalCollectiveContributionsWithData';

// Dynamic imports
const HeroEventDetails = dynamic(() => import('./HeroEventDetails'));

const HeroBackgroundEdit = dynamic(() => import('./HeroBackgroundEdit'), {
  loading() {
    return (
      <StyledHeroBackground>
        <LoadingPlaceholder height={BASE_HERO_HEIGHT} />
      </StyledHeroBackground>
    );
  },
});

const Translations = defineMessages({
  website: {
    id: 'Fields.website',
    defaultMessage: 'Website',
  },
});

const StyledShortDescription = styled.h2`
  margin-top: 8px;
  font-size: 16px;
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
const Hero = ({ collective, host, isAdmin, onPrimaryColorChange }) => {
  const intl = useIntl();
  const [hasColorPicker, showColorPicker] = React.useState(false);
  const [isEditingCover, editCover] = React.useState(false);
  const [message, showMessage] = React.useState(null);
  const isEditing = hasColorPicker || isEditingCover;
  const isCollective = collective.type === CollectiveType.COLLECTIVE;
  const isEvent = collective.type === CollectiveType.EVENT;
  const isProject = collective.type === CollectiveType.PROJECT;
  const isFund = collective.type === CollectiveType.FUND;

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
        {isEditingCover ? (
          <HeroBackgroundEdit collective={collective} onEditCancel={() => editCover(false)} />
        ) : (
          <HeroBackground collective={collective} />
        )}

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
            <StyledButton data-cy="edit-cover-btn" buttonSize="tiny" onClick={() => editCover(true)}>
              <Camera size="1.2em" />
              <Span ml={2} css={{ verticalAlign: 'middle' }}>
                <FormattedMessage id="Hero.EditCover" defaultMessage="Edit cover" />
              </Span>
            </StyledButton>
            <StyledButton data-cy="edit-main-color-btn" buttonSize="tiny" ml={3} onClick={() => showColorPicker(true)}>
              <Palette size="1.2em" />
              <Span ml={2} css={{ verticalAlign: 'middle' }}>
                <FormattedMessage id="Hero.EditColor" defaultMessage="Edit main color" />
              </Span>
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
          {isAdmin && (
            <Box>
              <Link
                href={
                  isEvent
                    ? `${collective.parentCollective?.slug}/events/${collective.slug}/edit`
                    : `${collective.slug}/edit`
                }
              >
                <StyledButton buttonSize="tiny" minWidth={96} my={3} data-cy="edit-collective-btn" tabIndex="-1">
                  <Settings size={14} />
                  <Span ml={1} css={{ verticalAlign: 'middle' }}>
                    <FormattedMessage id="Settings" defaultMessage="Settings" />
                  </Span>
                </StyledButton>
              </Link>
            </Box>
          )}
          <Box maxWidth={['70%', '60%', null, '40%', '45%']}>
            <H1
              color="black.800"
              fontSize="32px"
              lineHeight="36px"
              textAlign="left"
              data-cy="collective-title"
              wordBreak="normal"
            >
              {collective.name || collective.slug}
            </H1>
          </Box>
          {collective.company && (
            <StyledLink as={UserCompany} fontSize="20px" fontWeight={600} company={collective.company} />
          )}
          {!isEvent && (
            <Flex alignItems="center" flexWrap="wrap">
              {(isCollective || isFund || isProject) && (
                <StyledTag textTransform="uppercase" mx={2} my={2} mb={2}>
                  <I18nCollectiveTags
                    tags={getCollectiveMainTag(
                      get(collective, 'host.id'),
                      collective.tags,
                      collective.type,
                      collective.settings,
                    )}
                  />
                </StyledTag>
              )}
              <Flex my={2}>
                {collective.twitterHandle && (
                  <StyledLink
                    data-cy="twitterProfileUrl"
                    href={twitterProfileUrl(collective.twitterHandle)}
                    openInNewTab
                  >
                    <StyledRoundButton size={32} mr={3} title="Twitter" aria-label="Twitter link">
                      <Twitter size={12} />
                    </StyledRoundButton>
                  </StyledLink>
                )}
                {collective.githubHandle && (
                  <StyledLink data-cy="githubProfileUrl" href={githubProfileUrl(collective.githubHandle)} openInNewTab>
                    <StyledRoundButton size={32} mr={3} title="Github" aria-label="Github link">
                      <Github size={12} />
                    </StyledRoundButton>
                  </StyledLink>
                )}
                {collective.website && (
                  <StyledLink data-cy="collectiveWebsite" href={collective.website} openInNewTabNoFollow>
                    <StyledRoundButton
                      size={32}
                      mr={3}
                      title={intl.formatMessage(Translations.website)}
                      aria-label="Website link"
                    >
                      <Globe size={14} />
                    </StyledRoundButton>
                  </StyledLink>
                )}
              </Flex>
              {collective.parentCollective && (
                <Container mx={1} color="black.700" my="12px">
                  <FormattedMessage
                    id="Collective.Hero.ParentCollective"
                    defaultMessage="Part of: {parentName}"
                    values={{
                      parentName: (
                        <LinkCollective collective={collective.parentCollective}>
                          <Span data-cy="parentCollectiveName" color="black.700">
                            {collective.parentCollective.name}
                          </Span>
                        </LinkCollective>
                      ),
                    }}
                  />
                </Container>
              )}
              {host && collective.isApproved && host.id !== collective.id && !collective.isHost && (
                <Fragment>
                  <Container mx={1} color="black.700" my={2}>
                    <FormattedMessage
                      id="Collective.Hero.Host"
                      defaultMessage="{FiscalHost}: {hostName}"
                      values={{
                        FiscalHost: <DefinedTerm term={Terms.FISCAL_HOST} color="black.700" />,
                        hostName: (
                          <LinkCollective collective={host}>
                            <Span data-cy="fiscalHostName" color="black.700">
                              {host.name}
                            </Span>
                          </LinkCollective>
                        ),
                      }}
                    />
                  </Container>
                  {collective.connectedTo.length !== 0 && (
                    <Container mx={1} color="black.700" my="12px">
                      <FormattedMessage
                        id="Collective.Hero.ParentCollective"
                        defaultMessage="Part of: {parentName}"
                        values={{
                          parentName: (
                            <LinkCollective collective={collective.connectedTo[0].collective}>
                              <Span data-cy="parentCollectiveName" color="black.700">
                                {collective.connectedTo[0].collective.name}
                              </Span>
                            </LinkCollective>
                          ),
                        }}
                      />
                    </Container>
                  )}
                </Fragment>
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
                      fontSize="12px"
                      mr={2}
                    >
                      <FormattedMessage id="host.tos" defaultMessage="Terms of fiscal sponsorship" />
                    </StyledLink>
                  )}
                  <Container ml={2} mr={3} color="black.700" fontSize="12px">
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
                  {collective.platformFeePercent > 0 && (
                    <Container ml={2} mr={3} color="black.700" fontSize="12px">
                      <FormattedMessage
                        id="Hero.PlatformFee"
                        defaultMessage="Platform fee: {fee}"
                        values={{
                          fee: (
                            <DefinedTerm term={Terms.PLATFORM_FEE} color="black.700">
                              {collective.platformFeePercent || 0}%
                            </DefinedTerm>
                          ),
                        }}
                      />
                    </Container>
                  )}
                </Fragment>
              )}
            </Flex>
          )}
          <StyledShortDescription>{collective.description}</StyledShortDescription>
          {isEvent && <HeroEventDetails collective={collective} />}

          {!collective.isHost && [CollectiveType.USER, CollectiveType.ORGANIZATION].includes(collective.type) && (
            <HeroTotalCollectiveContributionsWithData collective={collective} />
          )}
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
    platformFeePercent: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    settings: PropTypes.shape({
      tos: PropTypes.string,
    }).isRequired,
    connectedTo: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        collective: PropTypes.shape({
          id: PropTypes.number,
          name: PropTypes.string.isRequired,
          slug: PropTypes.string.isRequired,
        }),
      }),
    ),
    parentCollective: PropTypes.shape({
      name: PropTypes.string,
      slug: PropTypes.string,
    }),
  }).isRequired,

  /** Collective's host */
  host: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
  }),

  /** Show the color picker input */
  onPrimaryColorChange: PropTypes.func.isRequired,

  /** Define if we need to display special actions like the "Edit collective" button */
  isAdmin: PropTypes.bool,
};

export default React.memo(Hero);
