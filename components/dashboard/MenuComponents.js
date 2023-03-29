import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getDashboardRoute } from '../../lib/url-helpers';

import { Box } from '../Grid';
import Link from '../Link';
import StyledLink from '../StyledLink';

import { SECTION_LABELS } from './constants';
import { DashboardContext } from './DashboardContext';

// display: flex;
// padding: 0.5rem;
// font-size: 0.875rem;
// line-height: 1.25rem;
// font-weight: 600;
// line-height: 1.5rem;
// border-radius: 0.375rem;
// column-gap: 0.75rem;

// active:
// background-color: #F9FAFB;
// color: #4F46E5;

// inctive:
// color: #374151;
// :hover {
//   color: #4F46E5;
//   }

const MenuLinkContainer = styled.li`
  a,
  ${StyledLink} {
    display: flex;
    //justify-content: space-between;
    align-items: center;
    grid-gap: 8px;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    padding: 8px;
    border-radius: 6px;
    -webkit-font-smoothing: antialiased;
    width: 100%;
    cursor: pointer;

    ${props =>
      props.isSelected
        ? css`
            background: ${props => props.theme.colors.black[50]};
            color: ${props => props.theme.colors.primary[700]};
            &:hover {
              color: ${props => props.theme.colors.primary[700]};
            }
          `
        : css`
            color: ${props => props.theme.colors.black[900]};
            &:hover {
              color: ${props => props.theme.colors.primary[700]};
              background: ${props => props.theme.colors.black[50]};
            }
          `}
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
}) => {
  const { selectedSection } = React.useContext(DashboardContext);
  const { formatMessage } = useIntl();
  if (conditional === false) {
    return null;
  }

  if (!children && SECTION_LABELS[section]) {
    children = formatMessage(SECTION_LABELS[section]);
  }
  console.log({ isSelected, lastPart: section && selectedSection === section, children });
  return (
    <MenuLinkContainer isSelected={isSelected || (section && selectedSection === section)}>
      {onClick ? (
        <StyledLink as="button" onClick={onClick} data-cy={`menu-item-${section}`}>
          {icon} {children}
          {isBeta ? ' (Beta)' : ''}
        </StyledLink>
      ) : (
        <Link href={getDashboardRoute(collective, section)} data-cy={`menu-item-${section}`}>
          {icon} {children}
          {isBeta ? ' (Beta)' : ''}
        </Link>
      )}
    </MenuLinkContainer>
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
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
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

export const useSubmenu = () => {
  const [submenuContent, setSubmenu] = React.useState();
  const menuContent = submenuContent && (
    <React.Fragment>
      <ul>
        <MenuLink onClick={() => setSubmenu(undefined)}>
          <span>
            &larr;&nbsp;
            <FormattedMessage id="Back" defaultMessage="Back" />
          </span>
        </MenuLink>
      </ul>
      {submenuContent}
    </React.Fragment>
  );
  const SubMenu = ({ icon, label, children, if: conditional }) => {
    return (
      <MenuLink
        if={conditional}
        icon={icon}
        onClick={() =>
          setSubmenu(
            <React.Fragment>
              <MenuSectionHeader>{label}</MenuSectionHeader>

              {children}
            </React.Fragment>,
          )
        }
      >
        <span>{label}</span>&nbsp;
        <span>&rarr;</span>
      </MenuLink>
    );
  };
  SubMenu.propTypes = {
    if: PropTypes.bool,
    label: PropTypes.node,
    children: PropTypes.node,
  };
  return { menuContent, SubMenu };
};
