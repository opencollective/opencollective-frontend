import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getSettingsRoute } from '../../lib/url-helpers';

import { Box } from '../Grid';
import Link from '../Link';
import StyledLink from '../StyledLink';

import { AdminPanelContext } from './AdminPanelContext';
import { SECTION_LABELS } from './constants';

const MenuLinkContainer = styled.li`
  margin: 4px -8px 0px;
  a,
  ${StyledLink} {
    display: flex;
    justify-content: space-between;
    font-weight: 500;
    font-size: 13px;
    line-height: 16px;
    line-height: 22px;
    padding: 4px 12px;
    border-radius: 100px;
    cursor: pointer;
    color: ${props => props.theme.colors.black[700]};
    &:hover {
      color: ${props => props.theme.colors.primary[700]};
    }
    ${props =>
      props.isSelected &&
      css`
        background: ${props => props.theme.colors.primary[50]};
        color: ${props => props.theme.colors.primary[700]};
        font-weight: 700;
        font-size: 14px;
      `}
    ${props =>
      props.isStrong &&
      css`
        font-weight: 700;
        font-size: 15px;
        line-height: 22px;
      `}
  }
`;

export const MenuLink = ({ collective, section, children, onClick, isSelected, isStrong, if: conditional, isBeta }) => {
  const { selectedSection } = React.useContext(AdminPanelContext);
  const { formatMessage } = useIntl();
  if (conditional === false) {
    return null;
  }

  if (!children && SECTION_LABELS[section]) {
    children = formatMessage(SECTION_LABELS[section]);
  }

  return (
    <MenuLinkContainer isSelected={isSelected || (section && selectedSection === section)} isStrong={isStrong}>
      {onClick ? (
        <StyledLink as="button" onClick={onClick} data-cy={`menu-item-${section}`}>
          {children}
          {isBeta ? ' (Beta)' : ''}
        </StyledLink>
      ) : (
        <Link href={getSettingsRoute(collective, section)} data-cy={`menu-item-${section}`}>
          {children}
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
  font-weight: 700;
  font-size: 12px;
  line-height: 16px;
  text-transform: uppercase;
  padding: 12px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid ${props => props.theme.colors.black[700]};
  color: ${props => props.theme.colors.black[800]};
`;

export const MenuContainer = styled.ul`
  margin: 0;
  margin-bottom: 100px;
  width: 256px;
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
  const SubMenu = ({ label, children, if: conditional }) => {
    return (
      <MenuLink
        if={conditional}
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
