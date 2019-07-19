import React from 'react';
import { PropTypes } from 'prop-types';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { Mail } from 'styled-icons/feather/Mail';

import Container from './Container';
import StyledButton from './StyledButton';
import { Span, H1 } from './Text';

import { Sections, AllSectionsNames, Dimensions } from './collective-page/_constants';
import LinkCollective from './LinkCollective';
import Avatar from './Avatar';
import Link from './Link';

const MenuLinkContainer = styled.div`
  padding: 0px 16px 3px 16px;
  color: #71757a;
  display: flex;
  align-items: center;
  border-bottom: 3px solid rgb(0, 0, 0, 0);
  cursor: pointer;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.2px;
  text-decoration: none;
  white-space: nowrap;

  // Override global link styles
  a {
    color: #71757a;
  }

  &:focus,
  &:focus a {
    color: ${themeGet('colors.primary.700')};
    text-decoration: none;
  }

  &:hover,
  &:hover a {
    color: ${themeGet('colors.primary.400')};
  }

  ${props =>
    props.isSelected &&
    css`
      color: #090a0a;
      font-weight: 500;
      border-bottom: 3px solid ${themeGet('colors.primary.500')};

      a {
        color: #090a0a;
      }
    `}
`;

const InfosContainer = styled(Container)`
  display: flex;
  padding-top: 14px;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: opacity 0.075s ease-out, transform 0.1s ease-out, visibility 0.075s ease-out;

  @media (max-width: 52em) {
    padding-top: 12px;
  }

  @media (max-width: 40em) {
    padding-top: 8px;
  }

  /** Hidden state */
  ${props =>
    props.isHidden &&
    css`
      visibility: hidden;
      opacity: 0;
      transform: translateY(-20px);
    `}
`;

const i18nSection = defineMessages({
  [Sections.CONTRIBUTE]: {
    id: 'CollectivePage.NavBar.Contribute',
    defaultMessage: 'Contribute',
  },
  [Sections.CONVERSATIONS]: {
    id: 'CollectivePage.NavBar.Conversations',
    defaultMessage: 'Conversations',
  },
  [Sections.BUDGET]: {
    id: 'CollectivePage.NavBar.Budget',
    defaultMessage: 'Budget',
  },
  [Sections.CONTRIBUTORS]: {
    id: 'CollectivePage.NavBar.Contributors',
    defaultMessage: 'Contributors',
  },
  [Sections.ABOUT]: {
    id: 'CollectivePage.NavBar.About',
    defaultMessage: 'About',
  },
  [Sections.UPDATES]: {
    id: 'CollectivePage.NavBar.Updates',
    defaultMessage: 'Updates',
  },
});

/**
 * The NavBar that displays all the invidual sections.
 */
const CollectiveNavbar = ({
  collective,
  sections,
  selected,
  LinkComponent,
  onCollectiveClick,
  onSectionClick,
  hideInfos,
  isAnimated,
  intl,
}) => {
  return (
    <Container borderBottom="1px solid #e6e8eb" background="white">
      <Container margin="0 auto" maxWidth={Dimensions.MAX_SECTION_WIDTH}>
        {/** Collective infos */}
        <InfosContainer isHidden={hideInfos} isAnimated={isAnimated} px={Dimensions.PADDING_X}>
          <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
            <Container background="rgba(245, 245, 245, 0.5)" borderRadius="25%">
              <Avatar borderRadius="25%" collective={collective} radius={40} />
            </Container>
          </LinkCollective>
          <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
            <H1 ml={3} py={2} color="black.800" fontSize={'H5'} lineHeight={'H5'} textAlign={['center', 'left']}>
              {collective.name || collective.slug}
            </H1>
          </LinkCollective>
        </InfosContainer>

        {/** Navbar items and buttons */}
        <Container display="flex" justifyContent="space-between" alignItems="center" height={[46, null, 58]}>
          <Container
            display="flex"
            height="100%"
            css={{ overflowX: 'auto' }}
            px={Dimensions.PADDING_X}
            data-cy="CollectivePage.NavBar"
          >
            {sections.map(section => (
              <MenuLinkContainer
                key={section}
                isSelected={section === selected}
                onClick={onSectionClick ? () => onSectionClick(section) : undefined}
              >
                <LinkComponent
                  collectivePath={collective.path}
                  section={section}
                  label={i18nSection[section] ? intl.formatMessage(i18nSection[section]) : section}
                />
              </MenuLinkContainer>
            ))}
          </Container>
          <Container display={['none', 'block']}>
            <a href={`mailto:hello@${collective.slug}.opencollective.com`}>
              <StyledButton mx={2}>
                <Span mr="5px">
                  <Mail size="1.1em" style={{ verticalAlign: 'sub' }} />
                </Span>
                <FormattedMessage id="Contact" defaultMessage="Contact" />
              </StyledButton>
            </a>
          </Container>
        </Container>
      </Container>
    </Container>
  );
};

CollectiveNavbar.propTypes = {
  /** Collective to show info about */
  collective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
  }).isRequired,
  /** Called with the new section name when it changes */
  onSectionClick: PropTypes.func,
  /** An optionnal function to build links URLs. Usefull to override behaviour in test/styleguide envs. */
  LinkComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  /** The list of sections to be displayed by the NavBar */
  sections: PropTypes.arrayOf(PropTypes.oneOf(AllSectionsNames)).isRequired,
  /** Called when users click the collective logo or name */
  onCollectiveClick: PropTypes.func,
  /** Currently selected section */
  selected: PropTypes.oneOf(AllSectionsNames),
  /** If true, the collective infos (avatar + name) will be hidden with css `visibility` */
  hideInfos: PropTypes.bool,
  /** If true, the collective infos will fadeInDown and fadeOutUp when transitionning */
  isAnimated: PropTypes.bool,
  /** @ignore From injectIntl */
  intl: PropTypes.object,
};

CollectiveNavbar.defaultProps = {
  sections: AllSectionsNames,
  hideInfos: false,
  isAnimated: false,
  // eslint-disable-next-line react/prop-types
  LinkComponent: function DefaultNavbarLink({ section, label, collectivePath }) {
    return <Link route={`${collectivePath}/v2#section-${section}`}>{label}</Link>;
  },
};

export default React.memo(injectIntl(CollectiveNavbar));
