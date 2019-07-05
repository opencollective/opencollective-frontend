import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Flex } from '@rebass/grid';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { get } from 'lodash';

import { Twitter } from 'styled-icons/feather/Twitter';
import { Github } from 'styled-icons/feather/Github';
import { ExternalLink } from 'styled-icons/feather/ExternalLink';
import { Cog } from 'styled-icons/typicons/Cog';
import { Mail } from 'styled-icons/feather/Mail';

import { getCollectiveMainTag } from '../../lib/collective.lib';
import { twitterProfileUrl, githubProfileUrl } from '../../lib/url_helpers';
import StyledButton from '../StyledButton';
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

import { AllSectionsNames } from './_constants';
import ContainerSectionContent from './ContainerSectionContent';
import NavBar from './NavBar';
import HeroBackground from './HeroBackground';

/**
 * The main container that uses `sticky` to fix on top.
 */
const MainContainer = styled.div`
  position: relative;
  width: 100%;
  top: 0;
  border-bottom: 1px solid #e6e8eb;
  z-index: 999;

  ${props =>
    props.isFixed &&
    css`
      position: fixed;
      top: 0;
      background: white;
    `}
`;

/**
 * Collective's page Hero/Banner/Cover component. Also includes the NavBar
 * used to navigate between collective page sections.
 *
 * Try it on https://styleguide.opencollective.com/#!/Hero
 */
class Hero extends Component {
  static propTypes = {
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

    /** Should the component be fixed and collapsed at the top of the window? */
    isFixed: PropTypes.bool,

    /** The list of sections to be displayed by the NavBar */
    sections: PropTypes.arrayOf(PropTypes.oneOf(AllSectionsNames)),

    /** The section currently selected */
    selectedSection: PropTypes.string,

    /** Called with the new section name when it changes */
    onSectionClick: PropTypes.func.isRequired,

    /** Called when the collective name or the logo is clicked */
    onCollectiveClick: PropTypes.func.isRequired,

    /** Define if we need to display special actions like the "Edit collective" button */
    canEdit: PropTypes.bool,

    /** @ignore from injectIntl */
    intl: PropTypes.object.isRequired,
  };

  static Translations = defineMessages({
    website: {
      id: 'collective.website.label',
      defaultMessage: 'Website',
    },
    settings: {
      id: 'collective.settings',
      defaultMessage: 'Settings',
    },
  });

  render() {
    const { collective, host, canEdit, intl, isFixed, onCollectiveClick } = this.props;
    const { slug, twitterHandle, githubHandle, website } = this.props.collective;
    const { formatMessage } = intl;

    return (
      <MainContainer isFixed={isFixed}>
        {/* Hero top */}
        <Container position="relative" pb={isFixed ? 0 : 4}>
          {!isFixed && <HeroBackground backgroundImage={collective.backgroundImage} />}
          <ContainerSectionContent
            pt={isFixed ? 16 : 40}
            display="flex"
            flexDirection="column"
            alignItems={isFixed ? 'flex-start' : ['center', 'flex-start']}
          >
            {/* Collective presentation (name, logo, description...) */}
            <Flex flexDirection={isFixed ? 'row' : 'column'} alignItems={isFixed ? 'center' : ['center', 'flex-start']}>
              <Container position="relative" display="flex" justifyContent={['center', 'flex-start']}>
                <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
                  <Container background="rgba(245, 245, 245, 0.5)" borderRadius="25%">
                    <Avatar borderRadius="25%" collective={collective} radius={isFixed ? 40 : 128} />
                  </Container>
                </LinkCollective>
                {canEdit && !isFixed && (
                  <Container position="absolute" right={-10} bottom={-5}>
                    <Link route="editCollective" params={{ slug }}>
                      <StyledRoundButton size={40} bg="#F0F2F5">
                        <Cog size={24} color="#4B4E52" />
                      </StyledRoundButton>
                    </Link>
                  </Container>
                )}
              </Container>
              <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
                <H1
                  ml={isFixed ? 2 : undefined}
                  p={2}
                  color="black.800"
                  fontSize={isFixed ? 'H5' : 'H3'}
                  lineHeight={isFixed ? 'H5' : 'H3'}
                  textAlign={['center', 'left']}
                >
                  {collective.name || collective.slug}
                </H1>
              </LinkCollective>
            </Flex>

            {!isFixed && (
              <React.Fragment>
                <Flex alignItems="center" justifyContent={['center', 'left']} flexWrap="wrap" px={2}>
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
                      <ExternalLinkNewTab href={website} title={formatMessage(Hero.Translations.website)}>
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
        {/* NavBar */}
        <ContainerSectionContent
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          height={isFixed ? 54 : [54, null, null, 84]}
          flexWrap="wrap"
          width={1}
        >
          <NavBar
            sections={this.props.sections}
            selected={this.props.selectedSection}
            onSectionClick={this.props.onSectionClick}
          />
          <Container py={2} ml={3} display={['none', null, null, 'block']}>
            <a href={`mailto:hello@${collective.slug}.opencollective.com`}>
              <StyledButton mx={2}>
                <Span mr="5px">
                  <Mail size="1.1em" style={{ verticalAlign: 'sub' }} />
                </Span>
                <FormattedMessage id="Contact" defaultMessage="Contact" />
              </StyledButton>
            </a>
          </Container>
        </ContainerSectionContent>
      </MainContainer>
    );
  }
}

export default injectIntl(Hero);
