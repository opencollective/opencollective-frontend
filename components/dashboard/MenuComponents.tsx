import React, { useEffect } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import ReactAnimateHeight from 'react-animate-height';
import { useIntl } from 'react-intl';

import { getDashboardRoute } from '../../lib/url-helpers';
import { cn } from '../../lib/utils';

import { Flex } from '../Grid';
import Link from '../Link';

import { SECTION_LABELS } from './constants';
import { DashboardContext } from './DashboardContext';

type MenuLinkProps = {
  if?: boolean;
  section?: string;
  selectedSection?: string;
  children?: React.ReactNode;
  isBeta?: boolean;
  isStrong?: boolean;
  onClick?: (e: Event) => void;
  href?: string;
  afterClick?: () => void;
  Icon?: LucideIcon;
  renderSubMenu?: (props: { parentSection: string }) => React.ReactNode;
  parentSection?: string;
  goToSection?: string;
  className?: string;
  external?: boolean;
};

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
}: MenuLinkProps) => {
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
      router.push({ pathname: getDashboardRoute(account, goToSection) });
    }
  };

  const renderButtonContent = ({ isSelected }) => (
    <Flex alignItems="center" justifyContent="space-between" flex={1}>
      <Flex alignItems="center" gridGap="8px">
        {Icon && (
          <Icon
            size={18}
            className={cn('group-hover:text-inherit', isSelected ? 'text-inherit' : 'text-muted-foreground')}
          />
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
          onClick={handleClick}
          href={getDashboardRoute(account, goToSection ? goToSection : section)}
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

export const MenuSectionHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('px-4 text-xs font-medium leading-6 text-slate-600', className)}>{children}</div>
);
export const MenuGroup = ({
  if: conditional,
  className,
  children,
  ...props
}: {
  if?: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  return conditional === false ? null : (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  );
};
