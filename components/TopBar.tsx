import React, { useRef, useState } from 'react';
import { debounce } from 'lodash';
import { ChevronDown, ChevronUp, Menu } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { getEnvVar } from '@/lib/env-utils';
import { MemberRole } from '@/lib/graphql/types/v2/schema';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import useWhitelabelProvider from '@/lib/hooks/useWhitelabel';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
import { cn, parseToBoolean } from '@/lib/utils';

import { Button } from '@/components/ui/Button';

import ChangelogTrigger from './changelog/ChangelogTrigger';
import { legacyTopBarItems, newMarketingTopbarItems } from './navigation/menu-items';
import ProfileMenu from './navigation/ProfileMenu';
import { SearchCommand } from './search/SearchCommand';
import Image from './Image';
import Link from './Link';
import PopupMenu from './PopupMenu';
import SearchModal from './Search';
import SearchIcon from './SearchIcon';
import TopBarMobileMenu from './TopBarMobileMenu';

const TopBarIcon = ({ provider }) => {
  return (
    <Link href={`/${provider?.slug || ''}`}>
      <div className="flex items-center">
        {provider?.logo ? (
          <img width={provider.logo.width ?? 150} src={provider.logo.url} alt={provider.name} />
        ) : (
          <React.Fragment>
            <Image width={32} height={32} src="/static/images/oc-logo-watercolor-256.png" alt="Open Collective" />{' '}
            {!provider && (
              <div className="mx-2 hidden lg:block">
                <Image height={21} width={141} src="/static/images/logotype.svg" alt="Open Collective" />
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </Link>
  );
};

const GoToDashboardButton = () => {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const slugParams = router.query.collectiveSlug || router.query.slug || router.query.parentCollectiveSlug;
  const parentSlugParams = router.query.parentCollectiveSlug;
  const parentSlug = Array.isArray(parentSlugParams) ? parentSlugParams[0] : parentSlugParams;
  const collectiveSlug = Array.isArray(slugParams) ? slugParams[0] : slugParams;

  const hasDashboardForSlug = slug =>
    LoggedInUser?.hasRole([MemberRole.ADMIN, MemberRole.ACCOUNTANT, MemberRole.COMMUNITY_MANAGER], { slug });

  return (
    <Button
      asChild
      variant="outline"
      className="mr-3 hidden whitespace-nowrap sm:flex"
      size="sm"
      data-cy="go-to-dashboard-btn"
    >
      <Link
        href={
          collectiveSlug && (hasDashboardForSlug(collectiveSlug) || hasDashboardForSlug(parentSlug))
            ? `/dashboard/${collectiveSlug}`
            : `/dashboard`
        }
      >
        <FormattedMessage defaultMessage="Go to Dashboard" id="LxSJOb" />
      </Link>
    </Button>
  );
};

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const NavButton = React.forwardRef<HTMLButtonElement, NavButtonProps>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'cursor-pointer bg-transparent p-2.5 text-base font-medium text-slate-800',
      'hover:bg-white focus:rounded-sm focus:bg-white active:text-black',
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
NavButton.displayName = 'NavButton';

interface NavItemProps {
  children: React.ReactNode;
}

const NavItem = ({ children }: NavItemProps) => (
  <div className="my-4 text-sm font-medium text-[#323334] hover:underline">{children}</div>
);

const TopBar = ({ showSearch = true, showMenuItems = true, showProfileAndChangelogMenu = true }) => {
  const intl = useIntl();
  const whitelabel = useWhitelabelProvider();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const { LoggedInUser } = useLoggedInUser();
  // We debounce this function to avoid conflicts between the menu button and TopBarMobileMenu useGlobalBlur hook.
  const debouncedSetShowMobileMenu = debounce(setShowMobileMenu);

  const toggleMobileMenu = () => {
    debouncedSetShowMobileMenu(state => !state);
  };

  const showMenu = showMenuItems ?? (!whitelabel || whitelabel?.links?.length > 0);

  const menuItems = parseToBoolean(getEnvVar('NEW_PRICING')) ? newMarketingTopbarItems : legacyTopBarItems;
  const useSearchCommandMenu = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_COMMAND);

  React.useLayoutEffect(() => {
    if (router.route !== '/signup' && LoggedInUser?.requiresProfileCompletion) {
      router.push('/signup/profile');
    }
  }, [LoggedInUser, router]);

  return (
    <div
      ref={ref}
      className="grid h-16 grid-cols-[1fr_auto_1fr] items-center bg-white px-3 py-2 sm:px-6"
      style={{
        borderBottom: whitelabel?.border ?? '1px solid rgb(232, 233, 235)',
        gridTemplateAreas: '"left center right"',
      }}
    >
      <div className="max-w-fit" style={{ gridArea: 'left' }}>
        <TopBarIcon provider={whitelabel} />
      </div>

      <div className="flex items-center justify-center" style={{ gridArea: 'center' }}>
        <div className="hidden md:block">
          {showMenu && (
            <ul className="m-0 flex min-w-[12.5rem] list-none items-center justify-center p-0 text-right">
              {!whitelabel && (
                <React.Fragment>
                  {menuItems.map(section => (
                    <PopupMenu
                      key={section.label.id}
                      zIndex={2000}
                      closingEvents={['focusin', 'mouseover']}
                      Button={({ onMouseOver, onClick, popupOpen, onFocus }) => (
                        <NavButton onMouseOver={onMouseOver} onFocus={onFocus} onClick={onClick}>
                          <span className="whitespace-nowrap">
                            {intl.formatMessage(section.label)}
                            {popupOpen ? (
                              <ChevronUp className="ml-0.5 inline h-5 w-5" />
                            ) : (
                              <ChevronDown className="ml-0.5 inline h-5 w-5" />
                            )}
                          </span>
                        </NavButton>
                      )}
                      placement="bottom"
                      popupMarginTop="-10px"
                    >
                      <div className="w-[140px] text-center">
                        {section.items.map(item => (
                          <Link key={item.label.id} href={item.href} target={item.target}>
                            <NavItem>{intl.formatMessage(item.label)}</NavItem>
                          </Link>
                        ))}
                      </div>
                    </PopupMenu>
                  ))}
                </React.Fragment>
              )}
              {whitelabel?.links?.map(({ label, href }) => (
                <a key={href} href={href}>
                  <NavButton className="whitespace-nowrap">{label}</NavButton>
                </a>
              ))}

              {showSearch && (
                <React.Fragment>
                  <div className="h-5 border-r border-[#DCDDE0]" />
                  <NavButton onClick={() => setShowSearchModal(true)}>
                    <div className="flex items-center">
                      <SearchIcon fill="#75777A" size={18} />
                      <span className="ml-1 hidden text-base lg:block">
                        <FormattedMessage id="Search" defaultMessage="Search" />
                      </span>
                    </div>
                  </NavButton>
                </React.Fragment>
              )}
            </ul>
          )}
        </div>
        {useSearchCommandMenu ? (
          <SearchCommand open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
        ) : (
          <SearchModal open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
        )}
      </div>

      {/* Right section - Profile, and Mobile Menu */}
      <div className="flex items-center justify-end" style={{ gridArea: 'right' }}>
        {showSearch && (
          <div className="md:hidden">
            <NavButton onClick={() => setShowSearchModal(true)}>
              <SearchIcon fill="#75777A" size={18} />
            </NavButton>
          </div>
        )}
        {showProfileAndChangelogMenu && (
          <React.Fragment>
            <div className="mr-2 hidden sm:block">
              <ChangelogTrigger />
            </div>
            {LoggedInUser && <GoToDashboardButton />}
            <ProfileMenu />
          </React.Fragment>
        )}
        <button
          type="button"
          className="mx-3 flex cursor-pointer bg-transparent md:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6 text-[#aaaaaa]" />
        </button>
        {showMobileMenu && <TopBarMobileMenu closeMenu={toggleMobileMenu} />}
      </div>
    </div>
  );
};

export default TopBar;
