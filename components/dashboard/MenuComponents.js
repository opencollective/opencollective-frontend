import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp';
import { useRouter } from 'next/router';
import ReactAnimateHeight from 'react-animate-height';
import { useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getDashboardRoute } from '../../lib/url-helpers';

import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

import { SECTION_LABELS } from './constants';
import { DashboardContext } from './DashboardContext';

const MenuLinkContainer = styled.li`
  a,
  ${StyledLink} {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    padding: 8px;
    border-radius: 6px;
    -webkit-font-smoothing: antialiased;
    width: 100%;
    cursor: pointer;

    svg {
      flex-shrink: 0;
    }

    ${props =>
      props.isSelected
        ? css`
            background: ${props => props.theme.colors.black[50]};
            color: ${props => props.theme.colors.primary[700]} !important;
            &:hover {
              color: ${props => props.theme.colors.primary[700]} !important;
            }
          `
        : css`
            color: ${props => props.theme.colors.black[900]} !important;
            &:hover {
              color: ${props => props.theme.colors.primary[700]} !important;
              background: ${props => props.theme.colors.black[50]};
            }
          `}

    ${props =>
      props.isSub
        ? css`
            padding-left: 32px;
          `
        : css``}
  }
`;

const ExpandButton = styled.button`
  border: 0;
  outline: 0;
  border-radius: 6px;
  flex-shrink: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: background 50ms ease-in-out;
  color: ${props => props.theme.colors.black[800]};
  &:hover {
    background: ${props => props.theme.colors.black[200]};
  }
`;

export const MenuLink = ({
  collective,
  section,
  children,
  onClick,
  isSelected,
  if: conditional,
  isBeta,
  icon = null,
  subMenu = null,
  isSub = false,
  expanded = false,
  setExpanded,
  goToSection,
}) => {
  const router = useRouter();
  const { selectedSection } = React.useContext(DashboardContext);
  const { formatMessage } = useIntl();
  if (conditional === false) {
    return null;
  }

  if (!children && SECTION_LABELS[section]) {
    children = formatMessage(SECTION_LABELS[section]);
  }
  const handleClick = e => {
    setExpanded?.(section);
    onClick?.(e);
    if (goToSection) {
      router.push({ pathname: getDashboardRoute(collective, goToSection) });
    }
  };
  const renderButtonContent = () => (
    <Flex alignItems="center" justifyContent="space-between" flex={1}>
      <Flex alignItems="center" gridGap="8px">
        {icon}
        <Span truncateOverflow>
          {children}
          {isBeta ? ' (Beta)' : ''}
        </Span>
      </Flex>
      {subMenu && (
        <ExpandButton
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();

            setExpanded(expanded ? null : section);
          }}
        >
          {expanded ? <ChevronUp size="16px" /> : <ChevronDown size="16px" />}
        </ExpandButton>
      )}
    </Flex>
  );
  return (
    <React.Fragment>
      <MenuLinkContainer isSelected={isSelected || (section && selectedSection === section)} isSub={isSub}>
        {onClick ? (
          <StyledLink as="button" onClick={handleClick} data-cy={`menu-item-${section}`}>
            {renderButtonContent()}
          </StyledLink>
        ) : (
          <Link
            onClick={handleClick}
            href={getDashboardRoute(collective, goToSection ? goToSection : section)}
            data-cy={`menu-item-${section}`}
          >
            {renderButtonContent()}
          </Link>
        )}
      </MenuLinkContainer>
      {subMenu && (
        <ReactAnimateHeight duration={150} height={expanded ? 'auto' : 0}>
          {subMenu}
        </ReactAnimateHeight>
      )}
    </React.Fragment>
  );
};

MenuLink.propTypes = {
  if: PropTypes.bool,
  section: PropTypes.string,
  selectedSection: PropTypes.string,
  children: PropTypes.node,
  isSelected: PropTypes.bool,
  isBeta: PropTypes.bool,
  isStrong: PropTypes.bool,
  onClick: PropTypes.func,
  afterClick: PropTypes.func,
  icon: PropTypes.node,
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
  subMenu: PropTypes.node,
  isSub: PropTypes.bool,
  expanded: PropTypes.bool,
  setExpanded: PropTypes.func,
  goToSection: PropTypes.string,
};

export const MenuSectionHeader = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 24px;
  margin-top: 12px;
  margin-bottom: 6px;

  color: ${props => props.theme.colors.black[600]};
`;

export const MenuContainer = styled.ul`
  margin: 0;
  margin-bottom: 100px;
  max-width: 100%;
  position: relative;
  a {
    color: ${props => props.theme.colors.black[900]};
    &:hover {
      color: ${props => props.theme.colors.black[700]};
    }
  }

  &,
  & ul {
    list-style-type: none;
    padding: 0;
    & li {
      padding: 2px 0;
    }
  }
`;

export const MenuGroup = ({ if: conditional, children, ...props }) => {
  return conditional === false ? null : (
    <Box as="ul" {...props}>
      {children}
    </Box>
  );
};

MenuGroup.propTypes = {
  if: PropTypes.bool,
  children: PropTypes.node,
};
