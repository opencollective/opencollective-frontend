import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Mail } from 'styled-icons/feather/Mail';

import StyledButton from '../StyledButton';
import { Span } from '../Text';
import Container from '../Container';

import { AllSectionsNames } from './_constants';
import ContainerSectionContent from './ContainerSectionContent';
import HeroTop from './HeroTop';
import NavBar from './NavBar';

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
const Hero = ({ collective, host, isFixed, canEdit, sections, selectedSection, onCollectiveClick, onSectionClick }) => (
  <MainContainer isFixed={isFixed}>
    {/* Hero top */}
    <HeroTop
      collective={collective}
      host={host}
      onCollectiveClick={onCollectiveClick}
      isCollapsed={isFixed}
      isAdmin={canEdit}
    />
    {/* NavBar */}
    <ContainerSectionContent
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      height={isFixed ? 54 : [54, null, null, 84]}
      flexWrap="wrap"
      width={1}
    >
      <NavBar sections={sections} selected={selectedSection} onSectionClick={onSectionClick} />
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

Hero.propTypes = {
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
};

export default React.memo(Hero);
