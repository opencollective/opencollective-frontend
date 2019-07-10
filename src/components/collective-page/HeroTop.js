import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { get } from 'lodash';

import { Twitter } from 'styled-icons/feather/Twitter';
import { Github } from 'styled-icons/feather/Github';
import { ExternalLink } from 'styled-icons/feather/ExternalLink';
import { Cog } from 'styled-icons/typicons/Cog';

import { getCollectiveMainTag } from '../../lib/collective.lib';
import { twitterProfileUrl, githubProfileUrl } from '../../lib/url_helpers';
import StyledRoundButton from '../StyledRoundButton';
import ExternalLinkNewTab from '../ExternalLinkNewTab';
import { Span, H1, H2 } from '../Text';
import Container from '../Container';
import Avatar from '../Avatar';
import I18nCollectiveTags from '../I18nCollectiveTags';
import StyledTag from '../StyledTag';
import DefinedTerm, { Terms } from '../DefinedTerm';
import Link from '../Link';
import LinkCollective from '../LinkCollective';

import ContainerSectionContent from './ContainerSectionContent';
import HeroBackground from './HeroBackground';

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

const HeroTop = ({ isCollapsed, collective, host, onCollectiveClick, isAdmin, intl }) => {
  const { slug, twitterHandle, githubHandle, website } = collective;

  return (
    <Container position="relative" pb={isCollapsed ? 0 : 4} minHeight={isCollapsed ? undefined : 325}>
      <HeroBackground backgroundImage={collective.backgroundImage} isDisplayed={!isCollapsed} />
      <ContainerSectionContent
        pt={isCollapsed ? 16 : 40}
        display="flex"
        flexDirection="column"
        alignItems={isCollapsed ? 'flex-start' : ['center', 'flex-start']}
      >
        {/* Collective presentation (name, logo, description...) */}
        <Flex
          flexDirection={isCollapsed ? 'row' : 'column'}
          alignItems={isCollapsed ? 'center' : ['center', 'flex-start']}
        >
          <Container position="relative" display="flex" justifyContent={['center', 'flex-start']}>
            <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
              <Container background="rgba(245, 245, 245, 0.5)" borderRadius="25%">
                <Avatar borderRadius="25%" collective={collective} radius={isCollapsed ? 40 : 128} />
              </Container>
            </LinkCollective>
            {isAdmin && !isCollapsed && (
              <Container position="absolute" right={-10} bottom={-5}>
                <Link route="editCollective" params={{ slug }} title={intl.formatMessage(Translations.settings)}>
                  <StyledRoundButton size={40} bg="#F0F2F5">
                    <Cog size={24} />
                  </StyledRoundButton>
                </Link>
              </Container>
            )}
          </Container>
          <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
            <H1
              ml={isCollapsed ? 2 : undefined}
              py={2}
              color="black.800"
              fontSize={isCollapsed ? 'H5' : 'H3'}
              lineHeight={isCollapsed ? 'H5' : 'H3'}
              textAlign={['center', 'left']}
            >
              {collective.name || slug}
            </H1>
          </LinkCollective>
        </Flex>

        {!isCollapsed && (
          <React.Fragment>
            <Flex alignItems="center" justifyContent={['center', 'left']} flexWrap="wrap">
              <StyledTag my={2} mb={2}>
                <I18nCollectiveTags tags={getCollectiveMainTag(get(collective, 'host.id'), collective.tags)} />
              </StyledTag>
              <Flex my={2} mx={2}>
                {twitterHandle && (
                  <ExternalLinkNewTab href={twitterProfileUrl(twitterHandle)} title="Twitter">
                    <StyledRoundButton size={32} mx={2}>
                      <Twitter size={12} />
                    </StyledRoundButton>
                  </ExternalLinkNewTab>
                )}
                {githubHandle && (
                  <ExternalLinkNewTab href={githubProfileUrl(githubHandle)} title="Github">
                    <StyledRoundButton size={32} mx={2}>
                      <Github size={12} />
                    </StyledRoundButton>
                  </ExternalLinkNewTab>
                )}
                {website && (
                  <ExternalLinkNewTab href={website} title={intl.formatMessage(Translations.website)}>
                    <StyledRoundButton size={32} mx={2}>
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
            </Flex>
            <H2 mt={2} fontSize="LeadParagraph" lineHeight="24px" textAlign="center">
              {collective.description}
            </H2>
          </React.Fragment>
        )}
      </ContainerSectionContent>
    </Container>
  );
};

HeroTop.propTypes = {
  isCollapsed: PropTypes.bool,
  /** The collective to display */
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    backgroundImage: PropTypes.string,
    twitterHandle: PropTypes.string,
    githubHandle: PropTypes.string,
    website: PropTypes.string,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  /** Collective's host */
  host: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
  }),
  /** Called when the collective name or the logo is clicked */
  onCollectiveClick: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  intl: PropTypes.object,
};

export default React.memo(injectIntl(HeroTop));
