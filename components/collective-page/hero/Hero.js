import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Palette } from '@styled-icons/boxicons-regular/Palette';
import { Camera } from '@styled-icons/feather/Camera';
import { Globe } from '@styled-icons/feather/Globe';
import { Mail } from '@styled-icons/feather/Mail';
import { Twitter } from '@styled-icons/feather/Twitter';
import { first } from 'lodash';
import { Tags } from 'lucide-react';
import dynamic from 'next/dynamic';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../../lib/constants/collectives';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import { twitterProfileUrl } from '../../../lib/url-helpers';

import CodeRepositoryIcon from '../../CodeRepositoryIcon';
import ContactCollectiveBtn from '../../ContactCollectiveBtn';
import Container from '../../Container';
import DefinedTerm, { Terms } from '../../DefinedTerm';
import EditTagsModal from '../../EditTagsModal';
import FollowButton from '../../FollowButton';
import { Box, Flex } from '../../Grid';
import I18nCollectiveTags from '../../I18nCollectiveTags';
import Link from '../../Link';
import LinkCollective from '../../LinkCollective';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledButton from '../../StyledButton';
import { Dropdown, DropdownContent } from '../../StyledDropdown';
import StyledLink from '../../StyledLink';
import StyledModal from '../../StyledModal';
import StyledRoundButton from '../../StyledRoundButton';
import StyledTag from '../../StyledTag';
import { H1, Span } from '../../Text';
import TruncatedTextWithTooltip from '../../TruncatedTextWithTooltip';
import { Button } from '../../ui/Button';
import UserCompany from '../../UserCompany';
import ContainerSectionContent from '../ContainerSectionContent';

import CollectiveColorPicker from './CollectiveColorPicker';
import HeroAvatar from './HeroAvatar';
import HeroBackground from './HeroBackground';
import HeroSocialLinks from './HeroSocialLinks';
import HeroTotalCollectiveContributionsWithData from './HeroTotalCollectiveContributionsWithData';

// Dynamic imports
const HeroEventDetails = dynamic(() => import('./HeroEventDetails'));

const HeroBackgroundCropperModal = dynamic(() => import('./HeroBackgroundCropperModal'), {
  loading() {
    return (
      <StyledModal>
        <LoadingPlaceholder height={300} minWidth={280} />
      </StyledModal>
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

const HiddenTagDropdownContainer = styled(Box)`
  text-align: center;
  width: 132px;
  max-height: 300px;
  overflow: auto;
`;

const HiddenTagItem = styled(StyledLink)`
  color: #323334;
  font-weight: 500;
  font-size: 14px;
  @media (hover: hover) {
    :hover {
      text-decoration: underline;
    }
  }
`;

/**
 * Collective's page Hero/Banner/Cover component.
 */
const Hero = ({ collective, host, isAdmin, onPrimaryColorChange }) => {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const [hasColorPicker, showColorPicker] = React.useState(false);
  const [isEditingCover, editCover] = React.useState(false);
  const [isEditingTags, editTags] = React.useState(false);
  const isEditing = hasColorPicker || isEditingCover;
  const isCollective = collective.type === CollectiveType.COLLECTIVE;
  const isEvent = collective.type === CollectiveType.EVENT;
  const isProject = collective.type === CollectiveType.PROJECT;
  const isFund = collective.type === CollectiveType.FUND;
  const parentIsHost = host && collective.parentCollective?.id === host.id;
  const firstConnectedAccount = first(collective.connectedTo);
  const connectedAccountIsHost = firstConnectedAccount && host && firstConnectedAccount.collective.id === host.id;
  const displayedConnectedAccount = connectedAccountIsHost ? null : firstConnectedAccount;
  // get only unique references
  const companies = [...new Set(collective.company?.trim().toLowerCase().split(' '))];
  const tagCount = collective.tags?.length;
  const displayedTags = collective.tags?.slice(0, 3);
  const hiddenTags = collective.tags?.slice(3);
  const numberOfHiddenTags = hiddenTags?.length;

  // Cancel edit mode when user navigates out to another collective
  useEffect(() => {
    editCover(false);
    showColorPicker(false);
  }, [collective.id]);

  const hasSocialLinks = collective.socialLinks && collective.socialLinks.length > 0;

  return (
    <Fragment>
      {isEditingCover && <HeroBackgroundCropperModal collective={collective} onClose={() => editCover(false)} />}
      {isEditingTags && <EditTagsModal collective={collective} onClose={() => editTags(false)} />}

      <Container position="relative" minHeight={325} zIndex={1000} data-cy="collective-hero">
        <HeroBackground collective={collective} />
        {isAdmin && !isEditing && (
          <Container data-cy="edit-collective-display-features" position="absolute" right={25} top={25} zIndex={222}>
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
            <HeroAvatar collective={collective} isAdmin={isAdmin} />
          </Container>
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
          <Flex>
            {companies.length > 0 &&
              companies.map(company => (
                <StyledLink key={company} as={UserCompany} mr={1} fontSize="20px" fontWeight={600} company={company} />
              ))}
          </Flex>
          <div className="mt-2 flex">
            <FollowButton buttonProps={{ buttonSize: 'tiny' }} account={collective} />
          </div>

          {!isEvent && (
            <Fragment>
              {(isCollective || isFund || isProject) && (
                <div className="my-7 mb-2 flex flex-wrap items-center gap-2" data-cy="collective-tags">
                  <StyledTag
                    textTransform="uppercase"
                    variant="rounded-left"
                    backgroundColor="black.200"
                    fontWeight={500}
                  >
                    <I18nCollectiveTags tags={collective.type} />
                  </StyledTag>
                  {tagCount > 0 && (
                    <Fragment>
                      <Container borderRight="1px solid #C3C6CB" height="22px" />
                      {displayedTags.map(tag => (
                        <Link key={tag} href={`/search?tag=${tag}`}>
                          <StyledTag variant="rounded-right" fontWeight={500}>
                            <I18nCollectiveTags tags={tag} />
                          </StyledTag>
                        </Link>
                      ))}
                      {tagCount > 3 && (
                        <Dropdown trigger="click">
                          {({ triggerProps, dropdownProps }) => (
                            <React.Fragment>
                              <StyledTag
                                as={StyledButton}
                                border="none"
                                variant="rounded-right"
                                fontWeight={500}
                                {...triggerProps}
                              >
                                <FormattedMessage
                                  id="expenses.countMore"
                                  defaultMessage="+ {count} more"
                                  values={{ count: tagCount - 3 }}
                                />
                              </StyledTag>
                              <DropdownContent {...dropdownProps} style={{ marginTop: '6px' }}>
                                <HiddenTagDropdownContainer>
                                  {hiddenTags.slice(0, numberOfHiddenTags - 1).map(tag => (
                                    <Fragment key={tag}>
                                      <Link href={`/search?tag=${tag}`}>
                                        <HiddenTagItem as={Container} mt={16} mb={16}>
                                          <I18nCollectiveTags tags={tag} />
                                        </HiddenTagItem>
                                      </Link>
                                      <hr className="my-5" />
                                    </Fragment>
                                  ))}
                                  <Link href={`/search?tag=${hiddenTags[numberOfHiddenTags - 1]}`}>
                                    <HiddenTagItem as={Container} mt={16} mb={16}>
                                      <I18nCollectiveTags tags={hiddenTags[numberOfHiddenTags - 1]} />
                                    </HiddenTagItem>
                                  </Link>
                                </HiddenTagDropdownContainer>
                              </DropdownContent>
                            </React.Fragment>
                          )}
                        </Dropdown>
                      )}
                    </Fragment>
                  )}
                  {isAdmin && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="h-6 gap-1 border-dashed text-xs text-muted-foreground"
                      onClick={() => editTags(true)}
                    >
                      <Tags size={16} />
                      <FormattedMessage id="StyledInputTags.EditLabel" defaultMessage="Edit Tags" />
                    </Button>
                  )}
                </div>
              )}
              <Flex alignItems="center" flexWrap="wrap" fontSize="14px" gap="16px" mt={2}>
                <Flex gap="16px" flexWrap="wrap">
                  {collective.canContact && (
                    <ContactCollectiveBtn collective={collective} LoggedInUser={LoggedInUser}>
                      {btnProps => (
                        <StyledRoundButton {...btnProps} size={32} title="Contact" aria-label="Contact">
                          <Mail size={12} />
                        </StyledRoundButton>
                      )}
                    </ContactCollectiveBtn>
                  )}
                  {hasSocialLinks && <HeroSocialLinks socialLinks={collective.socialLinks} relMe />}
                  {!hasSocialLinks && collective.twitterHandle && (
                    <StyledLink
                      data-cy="twitterProfileUrl"
                      href={twitterProfileUrl(collective.twitterHandle)}
                      openInNewTabNoFollowRelMe
                    >
                      <StyledRoundButton size={32} title="Twitter" aria-label="Twitter link">
                        <Twitter size={12} />
                      </StyledRoundButton>
                    </StyledLink>
                  )}
                  {!hasSocialLinks && collective.website && (
                    <StyledLink data-cy="collectiveWebsite" href={collective.website} openInNewTabNoFollowRelMe>
                      <StyledRoundButton
                        size={32}
                        title={intl.formatMessage(Translations.website)}
                        aria-label="Website link"
                      >
                        <Globe size={14} />
                      </StyledRoundButton>
                    </StyledLink>
                  )}
                  {!hasSocialLinks && collective.repositoryUrl && (
                    <StyledLink data-cy="repositoryUrl" href={collective.repositoryUrl} openInNewTabNoFollowRelMe>
                      <StyledButton buttonSize="tiny" color="black.700" height={32}>
                        <CodeRepositoryIcon size={12} repositoryUrl={collective.repositoryUrl} />
                        <Span ml={2}>
                          <FormattedMessage defaultMessage="Code repository" id="E2brjR" />
                        </Span>
                      </StyledButton>
                    </StyledLink>
                  )}
                </Flex>
                {Boolean(!parentIsHost && collective.parentCollective) && (
                  <Container mx={1} color="black.700" my="12px">
                    <FormattedMessage
                      id="Collective.Hero.ParentCollective"
                      defaultMessage="Part of: {parentName}"
                      values={{
                        parentName: (
                          <StyledLink as={LinkCollective} collective={collective.parentCollective} noTitle>
                            <TruncatedTextWithTooltip value={collective.parentCollective.name} cursor="pointer" />
                          </StyledLink>
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
                            <StyledLink
                              as={LinkCollective}
                              collective={host}
                              data-cy="fiscalHostName"
                              noTitle
                              color="black.700"
                            >
                              <TruncatedTextWithTooltip value={host.name} cursor="pointer" />
                            </StyledLink>
                          ),
                        }}
                      />
                    </Container>
                    {displayedConnectedAccount && (
                      <Container mx={1} color="black.700" my="12px">
                        <FormattedMessage
                          id="Collective.Hero.ParentCollective"
                          defaultMessage="Part of: {parentName}"
                          values={{
                            parentName: (
                              <StyledLink
                                as={LinkCollective}
                                collective={displayedConnectedAccount.collective}
                                noTitle
                                color="black.700"
                              >
                                <TruncatedTextWithTooltip
                                  value={displayedConnectedAccount.collective.name}
                                  cursor="pointer"
                                />
                              </StyledLink>
                            ),
                          }}
                        />
                      </Container>
                    )}
                  </Fragment>
                )}
                {collective.isHost && (
                  <Fragment>
                    {collective.type !== CollectiveType.COLLECTIVE && (
                      <Fragment>
                        {collective.settings?.tos && (
                          <StyledLink
                            openInNewTab
                            href={collective.settings.tos}
                            borderBottom="2px dotted #969ba3"
                            color="black.700"
                            textDecoration="none"
                            fontSize="12px"
                          >
                            <FormattedMessage id="host.tos" defaultMessage="Terms of fiscal hosting" />
                          </StyledLink>
                        )}
                        <Container color="black.700" fontSize="12px">
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
                    {collective.platformFeePercent > 0 && (
                      <Container color="black.700" fontSize="12px">
                        <FormattedMessage
                          id="Hero.PlatformFee"
                          defaultMessage="Platform fee: {fee}"
                          values={{
                            fee: (
                              <DefinedTerm term={Terms.PLATFORM_FEE} color="black.700">
                                {collective.platformFeePercent}%
                              </DefinedTerm>
                            ),
                          }}
                        />
                      </Container>
                    )}
                  </Fragment>
                )}
              </Flex>
            </Fragment>
          )}
          <StyledShortDescription>{collective.description}</StyledShortDescription>
          {isEvent && (
            <HeroEventDetails
              collective={collective}
              host={host}
              displayedConnectedAccount={displayedConnectedAccount}
            />
          )}

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
    backgroundImage: PropTypes.string,
    backgroundImageUrl: PropTypes.string,
    canContact: PropTypes.bool,
    twitterHandle: PropTypes.string,
    repositoryUrl: PropTypes.string,
    website: PropTypes.string,
    socialLinks: PropTypes.arrayOf(PropTypes.object),
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
      id: PropTypes.number,
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
