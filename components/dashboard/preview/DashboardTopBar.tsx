import React from 'react';
import clsx from 'clsx';
import { MoreHorizontal } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

import { getDashboardRoute } from '../../../lib/url-helpers';

import Link from '../../Link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/DropdownMenu';
import { DashboardContext } from '../DashboardContext';

const MenuLink = ({ section, label, href, Icon, isActive, onChangeVisiblity, visibility }) => {
  const { ref, inView } = useInView({
    /* Optional options */
    threshold: 1,
  });

  const visibilityAccordingToState = visibility[section];
  React.useEffect(() => {
    if (visibilityAccordingToState !== inView) {
      onChangeVisiblity(label, inView);
    }
  }, [inView, visibilityAccordingToState]);

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

const DashboardTopBar = ({ menuItems, isLoading, account }) => {
  const { selectedSection } = React.useContext(DashboardContext);
  const [visibility, setVisibility] = React.useState(createVisibilityObject(account?.slug, menuItems));
  // keep track of which menuItems are visible and which are not..
  // put inviisible into dropdown
  // put visible into topbar
  React.useEffect(() => {
    setVisibility(createVisibilityObject(account?.slug, menuItems));
  }, [account?.slug]);

  const onChangeVisiblity = (keyLabel, visible) => {
    setVisibility(state => ({ ...state, [keyLabel]: visible }));
  };
  const hiddenMenuItems = menuItems?.filter(({ label }) => !visibility[label]);

  const itemInHiddenMenuItemsSelected = hiddenMenuItems?.some(
    ({ section, subMenu }) => section === selectedSection || subMenu?.find(item => item.section === selectedSection),
  );
  return (
    <div className=" z-10 border-b bg-white py-2 pl-1.5 pr-2 xl:px-6">
      <div className="relative  flex justify-between">
        <div className="flex shrink gap-1.5 overflow-hidden">
          {isLoading
            ? [...Array(3)].map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-muted" />
              ))
            : menuItems?.map(({ label, Icon, section, subMenu }) => {
                return (
                  <MenuLink
                    key={`${account.slug}-${label}`}
                    Icon={Icon}
                    href={getDashboardRoute(account, section ?? subMenu[0].section)}
                    isActive={section === selectedSection || subMenu?.map(p => p.section).includes(selectedSection)}
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
              {hiddenMenuItems.map(({ label, Icon, section, subMenu }) => {
                const isSelected =
                  section === selectedSection || subMenu?.find(item => item.section === selectedSection);
                return (
                  <DropdownMenuItem
                    key={label}
                    className={clsx('group', isSelected && 'bg-blue-50 text-primary')}
                    asChild
                  >
                    <Link
                      href={getDashboardRoute(account, section ?? subMenu[0].section)}
                      className={clsx('flex items-center gap-2')}
                    >
                      <Icon
                        className={clsx(
                          'group-hover:text-inherit',
                          isSelected ? 'text-inherit' : 'text-muted-foreground',
                        )}
                        size={16}
                      />
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
