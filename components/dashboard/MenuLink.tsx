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
  label?: string;
  Icon?: LucideIcon;
  subMenu?: PageMenuItem[];
  section?: string;
};

export const MenuLink = ({ section, subMenu, Icon, label, href, isBeta, className, external }: MenuLinkProps) => {
  const { formatMessage } = useIntl();
  const { selectedSection, account } = React.useContext(DashboardContext);
  const [selfExpanded, setSelfExpanded] = React.useState(false);

  const sections = subMenu?.map(item => item.section);

  const sectionExpanded = sections?.includes(selectedSection);
  const subMenuExpanded = sectionExpanded || selfExpanded;
  const isSelected = !subMenu && section && selectedSection === section;

  if (!label && SECTION_LABELS[section]) {
    label = formatMessage(SECTION_LABELS[section]);
  }

  const classNames = cn(
    'group flex w-full gap-x-3 rounded-full px-3 py-1.5 text-sm font-medium leading-6 transition-colors',
    isSelected ? 'bg-blue-50/50 text-blue-700' : 'text-slate-700 hover:bg-blue-50/50 hover:text-blue-700',
    className,
  );

  return (
    <div>
      <Link
        href={href || getDashboardRoute(account, section || subMenu?.[0].section)}
        data-cy={`menu-item-${section || label}`}
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
                'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded transition-colors',
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
          <div className="ml-5 mt-2 flex flex-col space-y-1 border-l pl-4">
            {subMenu.map(item => (
              <MenuLink key={item.section} {...item} />
            ))}
          </div>
        </ReactAnimateHeight>
      )}
    </div>
  );
};
