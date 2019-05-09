import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage, defineMessages } from 'react-intl';
import { get } from 'lodash';

import { Mail } from 'styled-icons/feather/Mail';
import { Twitter } from 'styled-icons/feather/Twitter';
import { Github } from 'styled-icons/feather/Github';
import { ExternalLink } from 'styled-icons/feather/ExternalLink';
import { CheckCircle } from 'styled-icons/feather/CheckCircle';
import { Settings } from 'styled-icons/feather/Settings';

import withIntl from '../../lib/withIntl';
import { getCollectiveMainTag } from '../../lib/collective.lib';
import { twitterProfileUrl, githubProfileUrl } from '../../lib/url_helpers';
import StyledButton from '../StyledButton';
import StyledRoundButton from '../StyledRoundButton';
import ExternalLinkNewTab from '../ExternalLinkNewTab';
import { Span, H1, H2 } from '../Text';
import Container from '../Container';
import AvatarWithHost from '../AvatarWithHost';
import I18nCollectiveTags from '../I18nCollectiveTags';
import StyledTag from '../StyledTag';
import DefinedTerm, { Terms } from '../DefinedTerm';
import Link from '../Link';

import { AllSectionsNames, Dimensions } from './_constants';
import NavBar from './NavBar';
import HeroBackground from './HeroBackground';

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
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      image: PropTypes.string,
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
      image: PropTypes.string,
    }),

    /** Should the component be fixed and collapsed at the top of the window? */
    isFixed: PropTypes.bool,

    /** The list of sections to be displayed by the NavBar */
    sections: PropTypes.arrayOf(PropTypes.oneOf(AllSectionsNames)),

    /** Define if we need to display special actions like the "Edit collective" button */
    canEditCollective: PropTypes.bool,

    /** @ignore from withIntl */
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
    const { collective, host, canEditCollective, intl } = this.props;
    const { slug, twitterHandle, githubHandle, website } = this.props.collective;
    const { formatMessage } = intl;

    return (
      <div>
        {/* Hero top */}
        <Container position="relative" pb={4}>
          <HeroBackground backgroundImage={collective.backgroundImage} />
          <Container maxWidth={Dimensions.MAX_SECTION_WIDTH} px={Dimensions.PADDING_X} margin="0 auto">
            <Flex pt={40} flexWrap="wrap" width={1} justifyContent="center">
              {/* Collective presentation (name, logo, description...) */}
              <Box flex="1 1">
                <Flex mb={2} justifyContent={['center', 'left']}>
                  <AvatarWithHost collective={collective} host={host} radius={128} />
                </Flex>
                <Flex flexDirection="column" flex="1 1 400px">
                  <H1 fontSize="H3" textAlign={['center', 'left']}>
                    {collective.name || collective.slug}
                  </H1>
                  <Flex mb={[1, 2, 3]} alignItems="center" justifyContent={['center', 'flex-start']}>
                    <StyledTag mr={2}>
                      <I18nCollectiveTags tags={getCollectiveMainTag(get(collective, 'host.id'), collective.tags)} />
                    </StyledTag>
                    {host && (
                      <Container ml={3} color="black.600">
                        <FormattedMessage
                          id="Collective.Hero.Host"
                          defaultMessage="{FiscalHost}: {hostName}"
                          values={{
                            hostName: host.name,
                            FiscalHost: <DefinedTerm term={Terms.FISCAL_HOST} />,
                          }}
                        />
                      </Container>
                    )}
                  </Flex>
                  <H2 mt={2} fontSize="LeadParagraph" lineHeight="24px" textAlign={['center', 'left']}>
                    {collective.description}
                  </H2>
                </Flex>
              </Box>
              {/* Contact buttons */}
              <Flex flexWrap="wrap" justifyContent="center" mt={48}>
                <StyledButton disabled width={120} height={40} mb={3} mr={2} title="Coming soon">
                  <Span mr={2}>
                    <CheckCircle size="1em" />
                  </Span>
                  <FormattedMessage id="CollectivePage.Hero.Follow" defaultMessage="Follow" />
                </StyledButton>
                <Flex css={{ height: 40 }}>
                  <a href={`mailto:hello@${slug}.opencollective.com`} title="Email">
                    <StyledRoundButton size={40} mx={2}>
                      <Mail size={14} />
                    </StyledRoundButton>
                  </a>
                  {twitterHandle && (
                    <ExternalLinkNewTab href={twitterProfileUrl(twitterHandle)} title="Twitter">
                      <StyledRoundButton size={40} mx={2}>
                        <Twitter size={14} />
                      </StyledRoundButton>
                    </ExternalLinkNewTab>
                  )}
                  {githubHandle && (
                    <ExternalLinkNewTab href={githubProfileUrl(githubHandle)} title="Github">
                      <StyledRoundButton size={40} mx={2}>
                        <Github size={14} />
                      </StyledRoundButton>
                    </ExternalLinkNewTab>
                  )}
                  {website && (
                    <ExternalLinkNewTab href={website} title={formatMessage(Hero.Translations.website)}>
                      <StyledRoundButton size={40} mx={2}>
                        <ExternalLink size={14} />
                      </StyledRoundButton>
                    </ExternalLinkNewTab>
                  )}
                  {canEditCollective && (
                    <Link route="editCollective" params={{ slug }} title={formatMessage(Hero.Translations.settings)}>
                      <StyledRoundButton size={40} mx={2}>
                        <Settings size={14} />
                      </StyledRoundButton>
                    </Link>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Container>
        </Container>
        {/* NavBar */}
        <Container
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          maxWidth={Dimensions.MAX_SECTION_WIDTH}
          px={Dimensions.PADDING_X}
          margin="0 auto"
          height={[56, null, null, 84]}
        >
          <NavBar sections={this.props.sections} selected="join-us" onSectionClick={console.log} />
          <Box py={2} ml={3}>
            <StyledButton mx={2}>
              <FormattedMessage id="Collective.Hero.SubmitExpenses" defaultMessage="Submit expenses" />
            </StyledButton>
            <StyledButton mx={2} buttonStyle="dark">
              <FormattedMessage id="Collective.Hero.Donate" defaultMessage="Donate" />
            </StyledButton>
          </Box>
        </Container>
      </div>
    );
  }
}

export default withIntl(Hero);
