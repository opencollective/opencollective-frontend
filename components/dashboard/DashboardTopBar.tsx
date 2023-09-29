import React from 'react';
import clsx from 'clsx';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

import { getDashboardRoute } from '../../lib/url-helpers';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';

import { DashboardContext } from './DashboardContext';
import { useIntl } from 'react-intl';
import { SECTION_LABELS } from './constants';

export const MenuLink = ({ section, label, href, Icon, isActive, onChangeVisiblity, visibility }) => {
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 1,
  });

  const visibilityAccordingToState = visibility[label];
  React.useEffect(() => {
    if (visibilityAccordingToState !== inView) {
      onChangeVisiblity(label, inView);
    }
  }, [inView, visibilityAccordingToState]);

  // if (!label && SECTION_LABELS[section]) {
  //   label = formatMessage(SECTION_LABELS[section]);
  // }

  return (
    <Link
      href={href}
      ref={ref}
      data-cy={`menu-item-${section}`}
      className={clsx(
        'group flex w-full items-center gap-x-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium leading-6 antialiased transition-colors',
        isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-950 hover:bg-slate-50 hover:text-blue-700',
        inView ? 'visible' : 'invisible',
      )}
    >
      {Icon && (
        <Icon
          size={16}
          className={clsx('group-hover:text-inherit', isActive ? 'text-inherit' : 'text-muted-foreground')}
        />
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
};

const createVisibilityObject = (activeSlug, menuItems) => {
  return menuItems?.reduce((acc, item) => {
    acc[`${activeSlug}-${item.label}`] = true;
    return acc;
  }, {});
};

const DashboardTopBar = ({ isAccountantOnly, menu, isLoading, account }) => {
  const { selectedSection } = React.useContext(DashboardContext);
  const [visibility, setVisibility] = React.useState(createVisibilityObject(menu?.slug, menu?.items));
  // keep track of which menuItems are visible and which are not..
  // put inviisible into dropdown
  // put visible into topbar
  React.useEffect(() => {
    setVisibility(createVisibilityObject(menu?.slug, menu?.items));
  }, [menu?.slug]);

  const onChangeVisiblity = (keyLabel, visible) => {
    setVisibility(state => ({ ...state, [keyLabel]: visible }));
  };
  const hiddenMenuItems = menu?.items.filter(({ label }) => !visibility[label]);

  const itemInHiddenMenuItemsSelected = hiddenMenuItems?.some(
    ({ section, sections }) => section === selectedSection || sections?.includes(selectedSection),
  );
  return (
    <div className="sticky top-[65px] z-10 border-b bg-white py-2 pl-1.5 pr-2 md:px-5">
      <div className="relative  flex justify-between">
        <div className="flex shrink gap-1.5 overflow-hidden">
          {isLoading
            ? [...Array(3)].map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-muted" />
              ))
            : menu?.items.map(({ label, Icon, section, sections }) => {
                return (
                  <MenuLink
                    key={`${menu.slug}-${label}`}
                    Icon={Icon}
                    href={getDashboardRoute(account, section ?? sections[0])}
                    isActive={section === selectedSection || sections?.includes(selectedSection)}
                    section={section}
                    onChangeVisiblity={onChangeVisiblity}
                    visibility={visibility}
                    label={label}
                  />
                );
              })}
        </div>
        {hiddenMenuItems?.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={clsx(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-slate-50',
                  itemInHiddenMenuItemsSelected && 'bg-blue-50 text-primary',
                )}
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hiddenMenuItems.map(({ label, Icon, section, sections }) => {
                const isSelected = section === selectedSection || sections?.includes(selectedSection);
                return (
                  <DropdownMenuItem
                    key={label}
                    className={clsx('group', isSelected && 'bg-blue-50 text-primary')}
                    asChild
                  >
                    <Link
                      href={getDashboardRoute(account, section ?? sections[0])}
                      className={clsx('flex items-center gap-2')}
                    >
                      <Icon
                        className={clsx(
                          'group-hover:text-inherit',
                          isSelected ? 'text-inherit' : 'text-muted-foreground',
                        )}
                        size={16}
                      />{' '}
                      {label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default DashboardTopBar;
