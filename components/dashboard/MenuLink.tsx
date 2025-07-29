import React from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import ReactAnimateHeight from 'react-animate-height';
import { useIntl } from 'react-intl';

import { getDashboardRoute } from '../../lib/url-helpers';
import { cn } from '../../lib/utils';

import Link from '../Link';

import { SECTION_LABELS } from './constants';
import { DashboardContext } from './DashboardContext';
import { type PageMenuItem } from './Menu';

type MenuLinkProps = {
  isBeta?: boolean;
  href?: string;
  className?: string;
  external?: boolean;
  label?: string | React.JSX.Element;
  Icon?: LucideIcon;
  subMenu?: PageMenuItem[];
  section?: string;
  dataCy?: string;
};

export const MenuLink = ({
  section,
  subMenu,
  Icon,
  label,
  href,
  isBeta,
  className,
  external,
  dataCy,
}: MenuLinkProps) => {
  const { formatMessage } = useIntl();
  const { selectedSection, account, subpath } = React.useContext(DashboardContext);
  const [selfExpanded, setSelfExpanded] = React.useState(false);

  // also check if the route (section/subpath[0], e.g. 'reports/transactions') match the menu link
  const sectionAndSubpath = subpath?.length > 0 ? `${selectedSection}/${subpath[0]}` : selectedSection;

  const sections = subMenu?.map(item => item.section);

  const sectionExpanded = sections?.some(section => {
    return sectionAndSubpath === section;
  });
  const subMenuExpanded = sectionExpanded || selfExpanded;

  const isSelected = !subMenu && section && sectionAndSubpath === section;

  if (!label && SECTION_LABELS[section]) {
    label = formatMessage(SECTION_LABELS[section]);
  }

  const classNames = cn(
    'group flex w-full gap-x-3 rounded-full px-3 py-1.5 text-sm leading-6 font-medium transition-colors',
    isSelected ? 'bg-blue-50/50 text-blue-700' : 'text-slate-700 hover:bg-blue-50/50 hover:text-blue-700',
    className,
  );

  return (
    <div>
      <Link
        href={href || getDashboardRoute(account, section || subMenu?.[0].section)}
        data-cy={dataCy || `menu-item-${section || label}`}
        className={classNames}
      >
        <div className="flex w-full flex-1 items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            {Icon && (
              <Icon
                size={18}
                className={cn('group-hover:text-inherit', isSelected ? 'text-inherit' : 'text-muted-foreground')}
              />
            )}
            <span className="truncate">
              {label}
              {isBeta ? ' (Beta)' : ''}
            </span>
          </div>
          {subMenu ? (
            <button
              className={clsx(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors',
                !sectionExpanded && 'hover:bg-blue-100',
              )}
              disabled={sectionExpanded}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setSelfExpanded(!selfExpanded);
              }}
            >
              {subMenuExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          ) : (
            external && <ArrowRight size={16} className="transition-transform group-hover:animate-arrow-right" />
          )}
        </div>
      </Link>

      {subMenu && (
        <ReactAnimateHeight duration={150} height={subMenuExpanded ? 'auto' : 0}>
          <div className="mt-2 ml-5 flex flex-col space-y-1 border-l pl-4">
            {subMenu.map(item => (
              <MenuLink key={item.section} {...item} />
            ))}
          </div>
        </ReactAnimateHeight>
      )}
    </div>
  );
};
