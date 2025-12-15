import React, { useRef, useState } from 'react';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ChevronUp } from '@styled-icons/boxicons-regular/ChevronUp';
import { Bars as MenuIcon } from '@styled-icons/fa-solid/Bars';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { styled } from 'styled-components';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import useWhitelabelProvider from '../lib/hooks/useWhitelabel';
import theme from '../lib/theme';
import { getEnvVar } from '@/lib/env-utils';
import { MemberRole } from '@/lib/graphql/types/v2/schema';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
import { parseToBoolean } from '@/lib/utils';

import { Button } from '@/components/ui/Button';

import ChangelogTrigger from './changelog/ChangelogTrigger';
import { legacyTopBarItems, newMarketingTopbarItems } from './navigation/menu-items';
import ProfileMenu from './navigation/ProfileMenu';
import { SearchCommand } from './search/SearchCommand';
import Container from './Container';
import { Box, Flex } from './Grid';
import Hide from './Hide';
import Image from './Image';
import Link from './Link';
import PopupMenu from './PopupMenu';
import SearchModal from './Search';
import SearchIcon from './SearchIcon';
import StyledButton from './StyledButton';
import StyledLink from './StyledLink';
import TopBarMobileMenu from './TopBarMobileMenu';

const NavList = styled(Flex)`
  list-style: none;
  min-width: 12.5rem;
  text-align: right;
  align-items: center;
`;

const NavLinkContainer = styled(Box)`
  text-align: center;
  width: 140px;
`;

const NavButton = styled(StyledButton)`
  color: var(--color-slate-800);
  font-weight: 500;
  font-size: 16px;
  padding: 10px;
  cursor: pointer;
  @media (hover: hover) {
    &:hover {
      background-color: white !important;
    }
  }
  &:focus {
    background-color: white;
    border-radius: 1px;
  }
  &:active {
    color: black;
  }
`;

const NavItem = styled(StyledLink)`
  color: #323334;
  font-weight: 500;
  font-size: 14px;
  @media (hover: hover) {
    &:hover {
      text-decoration: underline;
    }
  }
`;

const TopBarIcon = ({ provider }) => {
  return (
    <Link href={`/${provider?.slug || ''}`}>
      <Flex alignItems="center">
        {provider?.logo ? (
          <img width={provider.logo.width ?? 150} src={provider.logo.url} alt={provider.name} />
        ) : (
          <React.Fragment>
            <Image width={32} height={32} src="/static/images/oc-logo-watercolor-256.png" alt="Open Collective" />{' '}
            {!provider && (
              <Hide xs sm md>
                <Box mx={2}>
                  <Image height={21} width={141} src="/static/images/logotype.svg" alt="Open Collective" />
                </Box>
              </Hide>
            )}
          </React.Fragment>
        )}
      </Flex>
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

const TopBar = ({ showSearch = true, showMenuItems = true, showProfileAndChangelogMenu = true }) => {
  const intl = useIntl();
  const whitelabel = useWhitelabelProvider();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  const ref = useRef(undefined);
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
    <Flex
      px={[3, '24px']}
      py={2}
      alignItems="center"
      flexDirection="row"
      css={{
        height: theme.sizes.navbarHeight,
        background: 'white',
        borderBottom: whitelabel?.border ?? '1px solid rgb(232, 233, 235)',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gridTemplateAreas: '"left center right"',
      }}
      ref={ref}
    >
      <div className="max-w-fit" style={{ gridArea: 'left' }}>
        <TopBarIcon provider={whitelabel} />
      </div>

      <Flex alignItems="center" justifyContent="center" css={{ gridArea: 'center' }}>
        <Hide xs sm>
          {showMenu && (
            <NavList as="ul" p={0} m={0} justifyContent="center" css="margin: 0;">
              {!whitelabel && (
                <React.Fragment>
                  {menuItems.map(section => (
                    <PopupMenu
                      key={section.label.id}
                      zIndex={2000}
                      closingEvents={['focusin', 'mouseover']}
                      Button={({ onMouseOver, onClick, popupOpen, onFocus }) => (
                        <NavButton
                          isBorderless
                          onMouseOver={onMouseOver}
                          onFocus={onFocus}
                          onClick={onClick}
                          whiteSpace="nowrap"
                        >
                          {intl.formatMessage(section.label)}
                          {popupOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </NavButton>
                      )}
                      placement="bottom"
                      popupMarginTop="-10px"
                    >
                      <NavLinkContainer>
                        {section.items.map(item => (
                          <Link key={item.label.id} href={item.href} target={item.target}>
                            <NavItem as={Container} mt={16} mb={16}>
                              {intl.formatMessage(item.label)}
                            </NavItem>
                          </Link>
                        ))}
                      </NavLinkContainer>
                    </PopupMenu>
                  ))}
                </React.Fragment>
              )}
              {whitelabel?.links?.map(({ label, href }) => (
                <a key={href} href={href}>
                  <NavButton as={Container} whiteSpace="nowrap">
                    {label}
                  </NavButton>
                </a>
              ))}

              {showSearch && (
                <React.Fragment>
                  <Container borderRight="1px solid #DCDDE0" height="20px" />
                  <NavButton isBorderless onClick={() => setShowSearchModal(true)}>
                    <div className="flex items-center">
                      <SearchIcon fill="#75777A" size={18} />
                      <span className="ml-1 hidden text-base lg:block">
                        <FormattedMessage id="Search" defaultMessage="Search" />
                      </span>
                    </div>
                  </NavButton>
                </React.Fragment>
              )}
            </NavList>
          )}
        </Hide>
        {useSearchCommandMenu ? (
          <SearchCommand open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
        ) : (
          <SearchModal open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
        )}
      </Flex>

      {/* Right section - Profile, and Mobile Menu */}
      <Flex alignItems="center" justifyContent="flex-end" css={{ gridArea: 'right' }}>
        {showSearch && (
          <Hide md lg>
            <NavButton isBorderless onClick={() => setShowSearchModal(true)}>
              <SearchIcon fill="#75777A" size={18} />
            </NavButton>
          </Hide>
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
        <Hide md lg>
          <Box mx={3} onClick={toggleMobileMenu}>
            <Flex as="a">
              <MenuIcon color="#aaaaaa" size={24} />
            </Flex>
          </Box>
          {showMobileMenu && <TopBarMobileMenu closeMenu={toggleMobileMenu} />}
        </Hide>
      </Flex>
    </Flex>
  );
};

export default TopBar;
