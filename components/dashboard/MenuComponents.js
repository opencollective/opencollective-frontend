import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';
import ReactAnimateHeight from 'react-animate-height';
import { useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getWorkspaceRoute } from '../../lib/url-helpers';

import { Flex } from '../Grid';
import Link from '../Link';
import StyledLink from '../StyledLink';
import { Span } from '../Text';
import { cn } from '../../lib/utils';
import { SECTION_LABELS } from './constants';
import { DashboardContext } from './DashboardContext';

export const MenuLink = ({
  section,
  children,
  onClick,
  href,
  if: conditional,
  isBeta,
  Icon,
  renderSubMenu,
  parentSection = null,
  goToSection,
  className,
  external,
}) => {
  const router = useRouter();
  const { selectedSection, expandedSection, setExpandedSection, account } = React.useContext(DashboardContext);
  const expanded = expandedSection === section;
  const { formatMessage } = useIntl();
  const isSelected = section && selectedSection === section;

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
    setExpandedSection?.(section);
    onClick?.(e);
    if (goToSection) {
      router.push({ pathname: getWorkspaceRoute(account, goToSection) });
    }
  };

  const renderButtonContent = ({ isSelected }) => (
    <Flex alignItems="center" justifyContent="space-between" flex={1}>
      <Flex alignItems="center" gridGap="8px">
        {Icon && (
          <Icon size={18} className={cn(' group-hover:text-inherit', isSelected ? 'text-inherit' : 'text-slate-400')} />
        )}
        <span className="truncate">
          {children}
          {isBeta ? ' (Beta)' : ''}
        </span>
      </Flex>
      {renderSubMenu ? (
        <button
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-blue-100"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();

            setExpandedSection(expanded ? null : section);
          }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      ) : (
        external && <ArrowRight size={16} className="transition-transform group-hover:animate-arrow-right" />
      )}
    </Flex>
  );

  const classNames = cn(
    'group w-full flex gap-x-3 rounded-full py-1.5 px-4 text-sm leading-6 font-medium transition-colors',
    isSelected ? 'bg-blue-50/50 text-blue-700' : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/50',
    !!parentSection && 'pl-8',
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
          onClick={handleClick}
          href={getWorkspaceRoute(account, goToSection ? goToSection : section)}
          {...(href && { href, onClick: undefined })}
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
  Icon: PropTypes.func,
  renderSubMenu: PropTypes.func,
  parentSection: PropTypes.string,
  goToSection: PropTypes.string,
};

// export const MenuSectionHeader = styled.div`
//   font-weight: 500;
//   font-size: 12px;
//   line-height: 24px;
//   margin-bottom: 6px;

//   color: ${props => props.theme.colors.black[600]};
// `;

export const MenuSectionHeader = ({ children, className }) => (
  <div className={cn('px-4 text-xs font-medium leading-6 text-slate-600', className)}>{children}</div>
);
export const MenuGroup = ({ if: conditional, children, ...props }) => {
  return conditional === false ? null : (
    <div className="space-y-2" {...props}>
      {children}
    </div>
  );
};

MenuGroup.propTypes = {
  if: PropTypes.bool,
  children: PropTypes.node,
};
