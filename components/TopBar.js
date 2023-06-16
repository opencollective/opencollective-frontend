import React, { Fragment, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ChevronUp } from '@styled-icons/boxicons-regular/ChevronUp';
import { Bars as MenuIcon } from '@styled-icons/fa-solid/Bars';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../lib/preview-features';
import theme from '../lib/theme';

import ChangelogTrigger from './changelog/ChangelogTrigger';
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
import { Span } from './Text';
import TopBarMobileMenu from './TopBarMobileMenu';
import TopBarProfileMenu from './TopBarProfileMenu';

const NavList = styled(Flex)`
  list-style: none;
  min-width: 20rem;
  text-align: right;
  align-items: center;
`;

const NavLinkContainer = styled(Box)`
  text-align: center;
  width: 140px;
`;

const NavButton = styled(StyledButton)`
  color: #323334;
  font-weight: 500;
  font-size: 16px;
  padding: 10px;
  cursor: pointer;
  @media (hover: hover) {
    :hover {
      background-color: white !important;
    }
  }
  :focus {
    background-color: white;
    border-radius: 1px;
  }
  :active {
    color: black;
  }
`;

const NavItem = styled(StyledLink)`
  color: #323334;
  font-weight: 500;
  font-size: 14px;
  @media (hover: hover) {
    :hover {
      text-decoration: underline;
    }
  }
`;

const MainNavItem = styled(StyledLink)`
  color: ${theme.colors.slate[700]};
  font-weight: 500;
  font-size: 14px;
  padding: 12px;
  border-radius: 8px;
  transition-property: color, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  @media (hover: hover) {
    :hover {
      color: ${theme.colors.slate[900]};
      background-color: ${theme.colors.slate[100]};
    }
  }
  ${props => props.isActive && `background-color: ${theme.colors.slate[100]};`}
`;

const TopBar = ({ showSearch, menuItems, showProfileAndChangelogMenu }) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const ref = useRef();
  const { LoggedInUser } = useLoggedInUser();
  const router = useRouter();

  // We debounce this function to avoid conflicts between the menu button and TopBarMobileMenu useGlobalBlur hook.
  const debouncedSetShowMobileMenu = debounce(setShowMobileMenu);

  const toggleMobileMenu = () => {
    debouncedSetShowMobileMenu(state => !state);
  };
  const useDashboard = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DASHBOARD);

  const isRouteActive = route => {
    const regex = new RegExp(`^${route}(/.*)?$`);
    return regex.test(router.asPath);
  };

  const homepageRoutes = [
    '/home',
    '/collectives',
    '/become-a-sponsor',
    '/become-a-host',
    '/pricing',
    '/how-it-works',
    '/fiscal-hosting',
    '/e2c',
  ];
  const onHomeRoute = homepageRoutes.some(isRouteActive);

  return (
    <Fragment>
      <Flex
        px={3}
        py={showSearch ? 2 : 3}
        alignItems="center"
        flexDirection="row"
        justifyContent="space-around"
        css={{ height: theme.sizes.navbarHeight, background: 'white', borderBottom: '1px solid rgb(232, 233, 235)' }}
        ref={ref}
      >
        <Link href={useDashboard ? (onHomeRoute ? '/home' : '/dashboard') : '/'}>
          <Flex alignItems="center">
            <Image width="36" height="36" src="/static/images/opencollective-icon.png" alt="Open Collective" />
            {(!useDashboard || onHomeRoute) && (
              <Hide xs sm md>
                <Box mx={2}>
                  <Image height={21} width={141} src="/static/images/logotype.svg" alt="Open Collective" />
                </Box>
              </Hide>
            )}
          </Flex>
        </Link>
        {onHomeRoute || !useDashboard ? (
          <Flex alignItems="center" justifyContent={['flex-end', 'flex-end', 'center']} flex="1 1 auto">
            <Hide xs sm>
              <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
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
                        <FormattedMessage defaultMessage="Solutions" />
                        {popupOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </NavButton>
                    )}
                    placement="bottom"
                    popupMarginTop="-10px"
                  >
                    <NavLinkContainer>
                      <Link href={'/collectives'}>
                        <NavItem as={Container} mt={16} mb={16}>
                          <FormattedMessage id="pricing.forCollective" defaultMessage="For Collectives" />
                        </NavItem>
                      </Link>
                      <Link href={'/become-a-sponsor'}>
                        <NavItem as={Container} mt={16} mb={16}>
                          <FormattedMessage defaultMessage="For Sponsors" />
                        </NavItem>
                      </Link>
                      <Link href={'/become-a-host'}>
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
                        <FormattedMessage id="company" defaultMessage="Company" />
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
                      <Link href={'/e2c'}>
                        <NavItem as={Container} mb={16}>
                          <FormattedMessage id="OC.e2c" defaultMessage="Exit to Community" />
                        </NavItem>
                      </Link>
                      <a href="https://docs.opencollective.com/help/about/introduction">
                        <NavItem as={Container} mb={16}>
                          <FormattedMessage id="collective.about.title" defaultMessage="About" />
                        </NavItem>
                      </a>
                    </NavLinkContainer>
                  </PopupMenu>
                )}
                {menuItems.docs && (
                  <Link href={'/help'}>
                    <NavButton as={Container} whiteSpace="nowrap">
                      <FormattedMessage defaultMessage="Help & Support" />
                    </NavButton>
                  </Link>
                )}
                {showSearch && menuItems.docs && (
                  <Container borderRight="2px solid #DCDDE0" height="20px" padding="5px" />
                )}
              </NavList>
            </Hide>
            {showSearch && (
              <NavButton isBorderless onClick={() => setShowSearchModal(true)}>
                <Flex>
                  <SearchIcon fill="#75777A" size={18} />
                  <Hide xs sm>
                    <Span ml="5px">
                      <FormattedMessage id="Search" defaultMessage="Search" />
                    </Span>
                  </Hide>
                </Flex>
              </NavButton>
            )}
            {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} />}
          </Flex>
        ) : (
          <Flex flex="1 1 auto">
            <Hide xs sm>
              <Flex alignItems="center" flex="1 1 auto" mx={4} gridGap={3}>
                <Link href="/dashboard">
                  <MainNavItem as={Container} isActive={isRouteActive('/dashboard')}>
                    <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                  </MainNavItem>
                </Link>
                <Link href="/search">
                  <MainNavItem as={Container} isActive={isRouteActive('/search')}>
                    <FormattedMessage defaultMessage="Explore" />
                  </MainNavItem>
                </Link>
                <Link href="/help">
                  <MainNavItem as={Container} isActive={isRouteActive('/help')}>
                    <FormattedMessage defaultMessage="Help & Support" />
                  </MainNavItem>
                </Link>
              </Flex>
            </Hide>
          </Flex>
        )}

        {showProfileAndChangelogMenu && (
          <React.Fragment>
            <Container mr={3}>
              <Hide xs>
                {onHomeRoute && useDashboard ? (
                  <Link href="/dashboard">
                    <MainNavItem primary as={Container} isActive={isRouteActive('/dashboard')}>
                      <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                    </MainNavItem>
                  </Link>
                ) : (
                  <ChangelogTrigger />
                )}
              </Hide>
            </Container>
            <TopBarProfileMenu />
          </React.Fragment>
        )}
        <Hide md lg>
          <Box mx={3} onClick={toggleMobileMenu}>
            <Flex as="a">
              <MenuIcon color="#aaaaaa" size={24} />
            </Flex>
          </Box>
          {showMobileMenu && (
            <TopBarMobileMenu closeMenu={toggleMobileMenu} useDashboard={useDashboard} onHomeRoute={onHomeRoute} />
          )}
        </Hide>
      </Flex>
    </Fragment>
  );
};

TopBar.propTypes = {
  showSearch: PropTypes.bool,
  showProfileAndChangelogMenu: PropTypes.bool,
  menuItems: PropTypes.object,
};

TopBar.defaultProps = {
  showSearch: true,
  showProfileAndChangelogMenu: true,
  menuItems: { solutions: true, product: true, company: true, docs: true },
};

export default TopBar;
