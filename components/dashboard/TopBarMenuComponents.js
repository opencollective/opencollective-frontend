import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp';
import { useRouter } from 'next/router';
import ReactAnimateHeight from 'react-animate-height';
import { useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getDashboardRoute } from '../../lib/url-helpers';
import { cn } from '../../lib/utils';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

import { SECTION_LABELS } from './constants';
import { DashboardContext } from './DashboardContext';

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
  section,
  children,
  onClick,
  href,
  className,
  if: conditional,
  isBeta,
  Icon,
  renderSubMenu,
  parentSection = null,
  goToSection,
  isActive,
}) => {
  const router = useRouter();
  const { selectedSection, expandedSection, setExpandedSection, account } = React.useContext(DashboardContext);
  const expanded = expandedSection === section;
  const { formatMessage } = useIntl();
  const isSelected = isActive; // (section && selectedSection === section) || (section && expandedSection === section);

  useEffect(() => {
    if (parentSection && isSelected) {
      setExpandedSection?.(parentSection);
    }
  }, [isSelected]);

  if (conditional === false) {
    return null;
  }

  if (!children && SECTION_LABELS[section]) {
    children = formatMessage(SECTION_LABELS[section]);
  }
  const handleClick = e => {
    // setExpandedSection?.(section);
    onClick?.(e);
    if (goToSection) {
      router.push({ pathname: getDashboardRoute(account, goToSection) });
    }
  };

  const renderButtonContent = () => (
    <React.Fragment>
      {Icon && (
        <Icon
          size={16}
          className={cn('group-hover:text-inherit', isSelected ? 'text-inherit' : 'text-muted-foreground')}
        />
      )}
      <span className="truncate">
        {children}
        {isBeta ? ' (Beta)' : ''}
      </span>
    </React.Fragment>
  );

  const classNames = cn(
    'group w-full flex gap-x-1.5 antialiased items-center rounded-full py-0.5 px-2.5 text-sm leading-6 font-medium transition-colors',
    isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-950 hover:text-blue-700 hover:bg-slate-50',
    !!parentSection && 'pl-11',
    className,
  );
  return (
    <React.Fragment>
      {onClick ? (
        <button className={classNames} onClick={handleClick} data-cy={`menu-item-${section}`}>
          {renderButtonContent({ isSelected })}
        </button>
      ) : (
        <Link
          href={href}
          // {...(href && { href, onClick: undefined })}
          data-cy={`menu-item-${section}`}
          className={classNames}
        >
          {renderButtonContent({ isSelected })}
        </Link>
      )}
      {renderSubMenu && (
        <ReactAnimateHeight duration={150} height={expanded ? 'auto' : 0}>
          {renderSubMenu({ parentSection: section })}
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
  isBeta: PropTypes.bool,
  isStrong: PropTypes.bool,
  onClick: PropTypes.func,
  afterClick: PropTypes.func,
  renderSubMenu: PropTypes.func,
  parentSection: PropTypes.string,
  goToSection: PropTypes.string,
};

export const MenuSectionHeader = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 24px;
  // margin-bottom: 6px;
  padding: 0 12px;

  color: ${props => props.theme.colors.black[600]};
`;

export const MenuContainer = styled.ul`
  margin: 0;
  max-width: 100%;
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  grid-gap: 4px;
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
    <Flex gridGap={2} {...props}>
      {children}
    </Flex>
  );
};

MenuGroup.propTypes = {
  if: PropTypes.bool,
  children: PropTypes.node,
};
