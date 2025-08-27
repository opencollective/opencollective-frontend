/**
 * @deprecated Will be replaced by `components/navigation/TopBar` when Workspace moves out of preview feature
 */

import React, { useRef, useState } from 'react';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ChevronUp } from '@styled-icons/boxicons-regular/ChevronUp';
import { Bars as MenuIcon } from '@styled-icons/fa-solid/Bars';
import { debounce } from 'lodash';
import NextImage from 'next/image';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import useWhitelabelProvider from '../lib/hooks/useWhitelabel';
import theme from '../lib/theme';
import { getEnvVar } from '@/lib/env-utils';
import { parseToBoolean } from '@/lib/utils';

import ChangelogTrigger from './changelog/ChangelogTrigger';
import ProfileMenu from './navigation/ProfileMenu';
import NewTopBar from './navigation/TopBar';
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
        ) : parseToBoolean(getEnvVar('NEW_PRICING')) ? (
          <React.Fragment>
            <NextImage
              width={555}
              height={75}
              className="hidden h-6 w-auto sm:block"
              src="/static/images/ofi-opencollective-logo.png"
              alt="Open Collective"
            />
            <Image
              width={32}
              height={32}
              className="block sm:hidden"
              src="/static/images/oc-logo-watercolor-256.png"
              alt="Open Collective"
            />
          </React.Fragment>
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

const TopBar = ({
  showSearch = true,
  menuItems = { solutions: false, product: true, company: false, docs: false, about: true },
  showProfileAndChangelogMenu = true,
  account,
}) => {
  const whitelabel = useWhitelabelProvider();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const ref = useRef(undefined);
  const { LoggedInUser } = useLoggedInUser();
  const router = useRouter();
  // We debounce this function to avoid conflicts between the menu button and TopBarMobileMenu useGlobalBlur hook.
  const debouncedSetShowMobileMenu = debounce(setShowMobileMenu);

  const toggleMobileMenu = () => {
    debouncedSetShowMobileMenu(state => !state);
  };

  const isRouteActive = route => {
    const regex = new RegExp(`^${route}(/.*)?$`);
    return regex.test(router.asPath);
  };

  const onDashboardRoute = isRouteActive('/dashboard');
  const homeRoutes = [
    '/',
    '/home',
    '/collectives',
    '/become-a-sponsor',
    '/become-a-host',
    '/pricing',
    '/how-it-works',
    '/fiscal-hosting',
    '/help',
    '/solutions',
  ];
  const onHomeRoute = homeRoutes.some(isRouteActive);

  if (onDashboardRoute || (!onHomeRoute && LoggedInUser)) {
    return <NewTopBar {...{ account }} />;
  }

  const showMenu = !whitelabel || whitelabel?.links?.length > 0;

  return (
    <Flex
      px={[3, '24px']}
      py={showSearch ? 2 : 3}
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
      <Box css={{ gridArea: 'left' }}>
        <TopBarIcon provider={whitelabel} />
      </Box>

      <Flex alignItems="center" justifyContent="center" css={{ gridArea: 'center' }}>
        <Hide xs sm>
          {showMenu && (
            <NavList as="ul" p={0} m={0} justifyContent="center" css="margin: 0;">
              {!whitelabel && (
                <React.Fragment>
                  {menuItems.solutions && (
                    <PopupMenu
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
                          <FormattedMessage defaultMessage="Solutions" id="asqGnV" />
                          {popupOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </NavButton>
                      )}
                      placement="bottom"
                      popupMarginTop="-10px"
                    >
                      <NavLinkContainer>
                        <Link href="/collectives">
                          <NavItem as={Container} mt={16} mb={16}>
                            <FormattedMessage id="pricing.forCollective" defaultMessage="For Collectives" />
                          </NavItem>
                        </Link>
                        <Link href="/become-a-sponsor">
                          <NavItem as={Container} mt={16} mb={16}>
                            <FormattedMessage defaultMessage="For Sponsors" id="1rESHf" />
                          </NavItem>
                        </Link>
                        <Link href="/become-a-host">
                          <NavItem as={Container} mt={16} mb={16}>
                            <FormattedMessage id="pricing.fiscalHost" defaultMessage="For Fiscal Hosts" />
                          </NavItem>
                        </Link>
                      </NavLinkContainer>
                    </PopupMenu>
                  )}

                  {menuItems.product && (
                    <PopupMenu
                      zIndex={2000}
                      closingEvents={['focusin', 'mouseover']}
                      Button={({ onClick, onMouseOver, popupOpen, onFocus }) => (
                        <NavButton
                          isBorderless
                          onMouseOver={onMouseOver}
                          onFocus={onFocus}
                          onClick={onClick}
                          whiteSpace="nowrap"
                        >
                          <FormattedMessage id="ContributionType.Product" defaultMessage="Product" />
                          {popupOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </NavButton>
                      )}
                      placement="bottom"
                      popupMarginTop="-10px"
                    >
                      <NavLinkContainer>
                        <Link href="/pricing">
                          <NavItem as={Container} mt={16} mb={16}>
                            <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />
                          </NavItem>
                        </Link>
                        <Link href="/how-it-works">
                          <NavItem as={Container}>
                            <FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" />
                          </NavItem>
                        </Link>
                        <Link href="/fiscal-hosting">
                          <NavItem as={Container} mt={16} mb={16}>
                            <FormattedMessage id="editCollective.fiscalHosting" defaultMessage="Fiscal Hosting" />
                          </NavItem>
                        </Link>
                      </NavLinkContainer>
                    </PopupMenu>
                  )}

                  {menuItems.company && (
                    <PopupMenu
                      zIndex={2000}
                      closingEvents={['focusin', 'mouseover']}
                      Button={({ onClick, onMouseOver, popupOpen, onFocus }) => (
                        <NavButton
                          isBorderless
                          onMouseOver={onMouseOver}
                          onFocus={onFocus}
                          onClick={onClick}
                          whiteSpace="nowrap"
                        >
                          <FormattedMessage id="Tags.ORGANIZATION" defaultMessage="Organization" />
                          {popupOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </NavButton>
                      )}
                      placement="bottom"
                      popupMarginTop="-10px"
                    >
                      <NavLinkContainer>
                        <a href="https://blog.opencollective.com/">
                          <NavItem as={Container} mt={16} mb={16}>
                            <FormattedMessage id="company.blog" defaultMessage="Blog" />
                          </NavItem>
                        </a>
                        <a href="https://documentation.opencollective.com/our-organization/about">
                          <NavItem as={Container} mb={16}>
                            <FormattedMessage id="collective.about.title" defaultMessage="About" />
                          </NavItem>
                        </a>
                      </NavLinkContainer>
                    </PopupMenu>
                  )}
                  {menuItems.docs && (
                    <Link href="/help">
                      <NavButton as={Container} whiteSpace="nowrap">
                        <FormattedMessage defaultMessage="Help & Support" id="Uf3+S6" />
                      </NavButton>
                    </Link>
                  )}
                  {menuItems.about && (
                    <PopupMenu
                      zIndex={2000}
                      closingEvents={['focusin', 'mouseover']}
                      Button={({ onClick, onMouseOver, popupOpen, onFocus }) => (
                        <NavButton
                          isBorderless
                          onMouseOver={onMouseOver}
                          onFocus={onFocus}
                          onClick={onClick}
                          whiteSpace="nowrap"
                        >
                          <FormattedMessage defaultMessage="About" id="g5pX+a" />
                          {popupOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </NavButton>
                      )}
                      placement="bottom"
                      popupMarginTop="-10px"
                    >
                      <NavLinkContainer>
                        <a href="https://blog.opencollective.com/">
                          <NavItem as={Container} mt={16} mb={16}>
                            <FormattedMessage id="company.blog" defaultMessage="Blog" />
                          </NavItem>
                        </a>
                        <a href="https://documentation.opencollective.com/our-organization/about">
                          <NavItem as={Container} mb={16}>
                            <FormattedMessage id="collective.about.title" defaultMessage="About" />
                          </NavItem>
                        </a>
                      </NavLinkContainer>
                    </PopupMenu>
                  )}
                </React.Fragment>
              )}
              {whitelabel?.links?.map(({ label, href }) => (
                <a key={href} href={href}>
                  <NavButton as={Container} whiteSpace="nowrap">
                    {label}
                  </NavButton>
                </a>
              ))}
              {showSearch && menuItems.docs && (
                <Container borderRight="2px solid #DCDDE0" height="20px" padding="5px" />
              )}
            </NavList>
          )}
        </Hide>
        {showSearch && (
          <NavButton isBorderless onClick={() => setShowSearchModal(true)}>
            <div className="flex items-center">
              <SearchIcon fill="#75777A" size={18} />
              <Hide xs sm>
                <span className="ml-1 text-base" ml="5px">
                  <FormattedMessage id="Search" defaultMessage="Search" />
                </span>
              </Hide>
            </div>
          </NavButton>
        )}
        <SearchModal open={showSearchModal} setOpen={setShowSearchModal} />
      </Flex>

      {/* Right section - Profile, and Mobile Menu */}
      <Flex alignItems="center" justifyContent="flex-end" css={{ gridArea: 'right' }}>
        {showProfileAndChangelogMenu && (
          <React.Fragment>
            <div className="mr-2 hidden sm:block">
              <ChangelogTrigger />
            </div>
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
