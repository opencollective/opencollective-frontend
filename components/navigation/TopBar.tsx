import React, { Fragment, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ChevronUp } from '@styled-icons/boxicons-regular/ChevronUp';
import { max, min } from 'lodash';
import { Compass, Frame, Search } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { ScrollDirection, useWindowScroll } from '../../lib/hooks/useWindowScroll';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import ChangelogTrigger from '../changelog/ChangelogTrigger';
import Container from '../Container';
import DividerIcon from '../DividerIcon';
import { Box, Flex } from '../Grid';
import Hide from '../Hide';
import Image from '../Image';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import PopupMenu from '../PopupMenu';
import SearchModal from '../Search';
import SearchTrigger from '../SearchTrigger';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { Span } from '../Text';
import { VerticalSeparator } from '../ui/Separator';

import ProfileMenu from './ProfileMenu';

const NavList = styled(Flex)`
  list-style: none;
  min-width: 20rem;
  text-align: right;
  align-items: center;
`;

const MobileFooterBar = styled(Flex)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 76px;
  border-top: 1px solid ${props => props.theme.colors.black[300]};
  background: #fff;
  z-index: 3000;
  padding: 8px 16px;
`;

const MobileFooterLink = styled(Link)<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  flex-grow: 1;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: ${props => props.theme.colors.black[700]};

  ${props =>
    props.isActive &&
    css`
      svg {
        color: ${props => props.theme.colors.primary[500]};
      }
      ${MobileFooterIconContainer} {
        background-color: ${props => props.theme.colors.primary[50]};
      }
    `}
`;

const MobileFooterIconContainer = styled(Box)`
  width: 36px;
  height: 36px;
  padding: 8px;
  border-radius: 24px;
`;

const NavLinkContainer = styled(Box)`
  text-align: center;
  width: 140px;
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

const MainNavItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 340px;
  flex-shrink: 1;
  color: #0f172a;
  font-size: 14px;
  height: 32px;
  padding: 0 12px;
  border-radius: 100px;
  white-space: nowrap;
  transition-property: color, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  text-overflow: ellipsis;
  overflow: hidden;

  ${props =>
    props.href &&
    css`
      @media (hover: hover) {
        :hover {
          color: #0f172a !important;
          background-color: #f1f5f9;
        }
      }
    `}
  ${props =>
    props.href &&
    css`
      &:hover {
        color: #0f172a !important;
        background-color: #f1f5f9;
      }
    }
  `}
  ${props => props.primary && `border: 1px solid #d1d5db;`}
  font-weight: ${props => (props.lightWeight ? `400` : '500')};

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const MobileFooterMenu = ({ onDashboardRoute, onSearchRoute }) => {
  const { direction, accPosition } = useWindowScroll();
  const bottom = direction === ScrollDirection.DOWN ? -min([accPosition, 76]) : -max([76 - accPosition, 0]);

  return (
    <MobileFooterBar alignItems="center" justifyContent="center" gap="12px" style={{ bottom: `${bottom}px` }}>
      <MobileFooterLink href="/workspace" isActive={onDashboardRoute}>
        <MobileFooterIconContainer className="icon-container">
          <Frame size={20} />
        </MobileFooterIconContainer>
        <FormattedMessage id="Workspace" defaultMessage="Workspace" />
      </MobileFooterLink>

      <MobileFooterLink href="/search" isActive={onSearchRoute}>
        <MobileFooterIconContainer className="icon-container">
          <Compass size={20} />
        </MobileFooterIconContainer>
        <FormattedMessage id="Explore" defaultMessage="Explore" />
      </MobileFooterLink>
    </MobileFooterBar>
  );
};

type TopBarProps = {
  showSearch?: boolean;
  showProfileAndChangelogMenu?: boolean;
  menuItems?: {
    solutions?: boolean;
    product?: boolean;
    company?: boolean;
    docs?: boolean;
  };
  account?: {
    parentCollective?: {
      name: string;
      slug: string;
    };
    name: string;
    slug: string;
  };
  navTitle?: string;
  loading?: boolean;
};

const TopBar = ({ menuItems, showProfileAndChangelogMenu, account, navTitle, loading }: TopBarProps) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const ref = useRef();
  const router = useRouter();

  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;

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
  const onDashboardRoute = isRouteActive('/workspace');
  const onSearchRoute = isRouteActive('/search');
  const ocLogoRoute = onHomeRoute ? '/home' : '/workspace';

  return (
    <Fragment>
      <Flex
        alignItems="center"
        flexDirection="row"
        justifyContent="space-between"
        css={{ background: 'white', borderBottom: '1px solid rgb(232, 233, 235)' }}
        py="16px"
        px={['16px', '40px']}
        height="73px"
        ref={ref}
        gridGap={2}
      >
        <Flex alignItems="center" gridGap={[2, 3]}>
          <Box flexShrink={0}>
            <Link href={ocLogoRoute}>
              <Flex alignItems="center" gridGap={2}>
                <Image width={32} height={32} src="/static/images/opencollective-icon.png" alt="Open Collective" />
                {onHomeRoute && (
                  <Hide xs sm md display="flex" alignItems="center">
                    <Image height={20} width={120} src="/static/images/logotype.svg" alt="Open Collective" />
                  </Hide>
                )}
              </Flex>
            </Link>
          </Box>
        </Flex>
        {onHomeRoute ? (
          <Hide xs sm>
            <Flex alignItems="center" justifyContent={['flex-end', 'flex-end', 'center']} flex="1 1 auto">
              <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
                {menuItems.solutions && (
                  <PopupMenu
                    zIndex={2000}
                    closingEvents={['focusin', 'mouseover']}
                    Button={({ onMouseOver, onClick, popupOpen, onFocus }) => (
                      <NavButton isBorderless onMouseOver={onMouseOver} onFocus={onFocus} onClick={onClick} my={2}>
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
                      <NavButton isBorderless onMouseOver={onMouseOver} onFocus={onFocus} onClick={onClick} my={2}>
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
                      <NavButton isBorderless onMouseOver={onMouseOver} onFocus={onFocus} onClick={onClick} my={2}>
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
              </NavList>
              <VerticalSeparator style={{ margin: '0px 16px', height: '20px' }} />
              <NavButton isBorderless onClick={() => setShowSearchModal(true)}>
                <Flex>
                  <Search size={18} />
                  <Hide xs sm>
                    <Span ml="5px">
                      <FormattedMessage id="Search" defaultMessage="Search" />
                    </Span>
                  </Hide>
                </Flex>
              </NavButton>
            </Flex>
          </Hide>
        ) : (
          <Flex flex={1} alignItems="center" gridGap={3} overflow={'hidden'}>
            {onDashboardRoute || onSearchRoute ? (
              !isMobile && (
                <React.Fragment>
                  <MainNavItem href="/workspace">
                    <FormattedMessage id="Workspace" defaultMessage="Workspace" />
                  </MainNavItem>
                  <MainNavItem href="/search">
                    <FormattedMessage id="Explore" defaultMessage="Explore" />
                  </MainNavItem>
                </React.Fragment>
              )
            ) : account || loading ? (
              <Flex alignItems="center" gridGap="0" maxWidth="100%" flexGrow={4}>
                {account?.parentCollective && (
                  <Hide flexShrink={1} display="flex" overflow={'hidden'} xs sm>
                    <DividerIcon size={32} style={{ margin: '0 -8px', flexShrink: 0, color: '#DCDDE0' }} />
                    <MainNavItem lightWeight flexShrink={3} href={getCollectivePageRoute(account.parentCollective)}>
                      <span>{account.parentCollective.name}</span>
                    </MainNavItem>
                  </Hide>
                )}
                <DividerIcon size={32} style={{ margin: '0 -8px', flexShrink: 0, color: '#DCDDE0' }} />
                <MainNavItem href={getCollectivePageRoute(account)}>
                  <span>
                    {account ? account.name : <LoadingPlaceholder height="16px" width="120px" borderRadius="4px" />}
                  </span>
                </MainNavItem>
              </Flex>
            ) : (
              !onSearchRoute && navTitle && <MainNavItem as="div">{navTitle}</MainNavItem>
            )}
          </Flex>
        )}
        <Flex alignItems="center" gridGap={2} flexShrink={4} flexGrow={0}>
          {showProfileAndChangelogMenu && (
            <Fragment>
              {onHomeRoute && (
                <React.Fragment>
                  <MainNavItem href="/workspace">
                    <FormattedMessage id="Workspace" defaultMessage="Workspace" />
                  </MainNavItem>
                </React.Fragment>
              )}
              {!onHomeRoute && <SearchTrigger setShowSearchModal={setShowSearchModal} />}
              <Hide xs>
                <ChangelogTrigger height="40px" width="40px" />
              </Hide>
              <ProfileMenu />
            </Fragment>
          )}
        </Flex>
      </Flex>
      {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} />}
      {isMobile && (onDashboardRoute || onSearchRoute) && <MobileFooterMenu {...{ onDashboardRoute, onSearchRoute }} />}
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
