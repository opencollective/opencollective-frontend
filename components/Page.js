import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Cog } from '@styled-icons/heroicons-outline/Cog';
import { CreditCard } from '@styled-icons/heroicons-outline/CreditCard';
import { Template } from '@styled-icons/heroicons-outline/Template';
import { ViewGrid } from '@styled-icons/heroicons-outline/ViewGrid';
import { themeGet } from '@styled-system/theme-get';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { Plus } from '@styled-icons/heroicons-outline/Plus';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import StyledButton from './StyledButton';

import Body from '../components/Body';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import { Flex } from '../components/Grid';
import Header from '../components/Header';
import Image from '../components/Image';
import Link from '../components/Link';
import { Span } from '../components/Text';
import { Box } from '../components/Grid';

import SideBarProfileMenu from './SideBarProfileMenu';
import { withUser } from './UserProvider';
// const CreateButton = styled(StyledButton)`
//   //margin: 0 4px;
//   background: transparent;
//   padding: 12px 12px 12px 12px;
//   border-radius: 8px;
//   border-width: 1px;
//   letter-spacing: 0;
//   border-color: transparent;
//   box-shadow: 0px 0px 0px 2px #e2e8f0;

//   &:hover {
//     border-color: transparent;
//     background: #e8edf4;
//     color: ${themeGet('colors.black.900')};
//     box-shadow: 0px 0px 0px 2px #e8edf4;
//   }
//   display: flex;
//   align-items: center;
//   gap: 12px;
//   //margin-right: 20px;
//   font-size: 14px;
//   font-weight: 500;
//   color: ${themeGet('colors.black.700')};
// `;
const Slider = styled.div`
  background: #f8fafc;
  border-right: 1px solid ${themeGet('colors.black.200')};
  width: ${props => (props.show ? '250px' : '0px')};
  transition: width 0.3s ease-in-out;
  overflow: hidden;
  flex-shrink: 0;
`;

const SidebarContainer = styled.div`
background: #f8fafc; // rgb(249 250 251);
height: 100vh;
flex-shrink: 0;
width: 250px;
border-right: 1px solid ${themeGet('colors.black.200')};
display: flex;
flex-direction: column;
justify-content: space-between;
items-align: stretch;
padding: 16px 8px;
width: 250px
overflow-x: hidden;
overflow-y: auto;
`;
const Main = styled.div`
  flex-grow: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 24px;
`;

const StyledNavLink = styled(Link)`
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  letter-spacing: 0;
  border-radius: 4px;
  padding: 10px 12px;
  curosor: pointer;
  color: ${props => (props.active ? themeGet('colors.black.900') : themeGet('colors.black.800'))};
  background: ${props => (props.active ? '#e8edf4' : 'transparent')};
  display: flex;
  align-items: center;
  gap: 12px;
  span {
    display: inline-block;
  }
  &:hover {
    color: ${themeGet('colors.black.800')};

    background: ${props => (props.active ? '#e8edf4' : '#f1f5f9')};
  }
`;

const NavLabel = styled.div`
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  letter-spacing: 0;
  border-radius: 4px;
  padding: 10px 12px;
  curosor: pointer;
  color: ${props => (props.active ? themeGet('colors.black.900') : themeGet('colors.black.800'))};
  background: ${props => (props.active ? '#e8edf4' : 'transparent')};
  display: flex;
  align-items: center;
  gap: 12px;
  span {
    display: inline-block;
  }
`;

const CircleStack = ({ size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
    style={{ width: `${size}px`, height: `${size}px` }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
    />
  </svg>
);

const Wallet = ({ size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
      />
    </svg>
  );
};

const User = ({ size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
};

const UserGroup = ({ size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </svg>
  );
};

const Building = ({ size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
      />
    </svg>
  );
};

const ArrowLeft = ({ size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
};

const userPages = slug => [
  { label: 'Profile page', href: `/${slug}`, icon: <Template size="16" /> },
  { label: 'Contributions', href: `/${slug}/recurring-contributions`, icon: <CircleStack size="16" /> },
  { label: 'Transactions', href: `/${slug}/transactions`, icon: <Wallet size="16" /> },
  { label: 'Applications', href: `/applications`, icon: <ViewGrid size="16" /> },
  { label: 'Settings', href: `/${slug}/admin/info`, icon: <Cog size="16" />, subMenu: true },
];

const orgPages = slug => [
  { label: 'Profile page', href: `/${slug}`, icon: <Template size="16" /> },
  { label: 'Expenses', href: `/${slug}/admin/expenses`, icon: <CircleStack size="16" /> },
  { label: 'Financial Contributions', href: `/${slug}/admin/orders`, icon: <Wallet size="16" /> },
  { label: 'Virtual Cards', href: `/${slug}/admin/host-virtual-cards`, icon: <CreditCard size="16" /> },
  { label: 'Pending Applications', href: `/${slug}/admin/pending-applications`, icon: <ViewGrid size="16" /> },
  { label: 'Hosted Collectives', href: `/${slug}/admin/hosted-collectives`, icon: <ViewGrid size="16" /> },

  { label: 'Reports', href: `/${slug}/admin/reports`, icon: <ViewGrid size="16" /> },
  { label: 'Settings', href: `/${slug}/admin/info`, icon: <Cog size="16" />, subMenu: true },

  // { label: 'Fiscal Host Settings', href: `/${slug}/admin/fiscal-hosting`, icon: <Cog size="16" /> },
];

const collectivePages = slug => [
  { label: 'Profile page', href: `/${slug}`, icon: <Template size="16" /> },
  { label: 'Contributions', href: `/${slug}/recurring-contributions`, icon: <CircleStack size="16" /> },
  { label: 'Financial Contributions', href: `/${slug}/admin/orders`, icon: <Wallet size="16" /> },
  { label: 'Expenses', href: `/${slug}/expenses`, icon: <CircleStack size="16" /> },
  { label: 'Transactions', href: `/${slug}/transactions`, icon: <Wallet size="16" /> },
  { label: 'Virtual Cards', href: `/${slug}/admin/virtual-cards`, icon: <CreditCard size="16" /> },
  { label: 'Settings', href: `/${slug}/admin/info`, icon: <Cog size="16" />, subMenu: true },
];

export const Sidebar = () => {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const [showSettingsMenu, setShowSettingsMenu] = React.useState(false);
  const [activeCollective, setActiveCollectiveState] = React.useState(null);
  useEffect(() => {
    if (LoggedInUser) {
      setActiveCollective({ ...LoggedInUser.collective, type: 'USER', role: 'Personal profile' });
    }
  }, [LoggedInUser]);

  const setActiveCollective = collective => {
    setShowSettingsMenu(false);
    setActiveCollectiveState(collective);
  };
  // if (!LoggedInUser || !activeCollective) return null;
  // console.log({ activeCollective });

  const pages = activeCollective
    ? activeCollective?.type === 'USER'
      ? userPages(activeCollective.slug)
      : activeCollective?.type === 'ORGANIZATION'
      ? orgPages(activeCollective.slug)
      : collectivePages(activeCollective.slug)
    : [];

  const userSettings = activeCollective
    ? [
        { label: 'Settings', icon: <User size="16" /> },
        { label: 'Info', href: `/${activeCollective.slug}/admin/info` },
        { label: 'Profile Page', href: `/${activeCollective.slug}/admin/collective-page` },
        { label: 'Payment Methods', href: `/${activeCollective.slug}/admin/payment-methods` },
        { label: 'Payment Receipts', href: `/${activeCollective.slug}/admin/payment-receipts` },
        { label: 'Gift Cards', href: `/${activeCollective.slug}/admin/gift-cards` },
        { label: 'Webhooks', href: `/${activeCollective.slug}/admin/webhooks` },
        { label: 'Authorized Apps', href: `/${activeCollective.slug}/admin/authorized-apps` },
        { label: 'Two-factor authentication', href: `/${activeCollective.slug}/admin/two-factor-auth` },
        { label: 'For developers', href: `/${activeCollective.slug}/admin/for-developers` },
        { label: 'Advanced', href: `/${activeCollective.slug}/admin/advanced` },
      ]
    : [];

  const collectiveSettings = activeCollective
    ? [
        { label: 'Settings', icon: <UserGroup size="16" /> },
        { label: 'Info', href: `/${activeCollective.slug}/admin/info` },
        { label: 'Profile Page', href: `/${activeCollective.slug}/admin/collective-page` },
        { label: 'Connected Accounts', href: `/${activeCollective.slug}/admin/connected-accounts` },
        { label: 'Policies', href: `/${activeCollective.slug}/admin/policies` },
        { label: 'Custom Email', href: `/${activeCollective.slug}/admin/custom-email` },
        { label: 'Export', href: `/${activeCollective.slug}/admin/export` },
        { label: 'Fiscal Host', href: `/${activeCollective.slug}/admin/host` },
        { label: 'Team', href: `/${activeCollective.slug}/admin/members` },
        { label: 'Payment Methods', href: `/${activeCollective.slug}/admin/payment-methods` },
        { label: 'Payment Receipts', href: `/${activeCollective.slug}/admin/payment-receipts` },
        { label: 'Tiers', href: `/${activeCollective.slug}/admin/tiers-revamp` },
        { label: 'Webhooks', href: `/${activeCollective.slug}/admin/webhooks` },
        { label: 'For developers', href: `/${activeCollective.slug}/admin/for-developers` },
        { label: 'Activity Log', href: `/${activeCollective.slug}/admin/activity-log` },
        { label: 'Security', href: `/${activeCollective.slug}/admin/security` },
        { label: 'Advanced', href: `/${activeCollective.slug}/admin/advanced` },
      ]
    : [];

  const fiscalHostSettings = activeCollective
    ? [
        { label: 'Organization Settings', icon: <UserGroup size="16" /> },
        { label: 'Info', href: `/${activeCollective.slug}/admin/info` },
        { label: 'Profile Page', href: `/${activeCollective.slug}/admin/collective-page` },
        { label: 'Connected Accounts', href: `/${activeCollective.slug}/admin/connected-accounts` },
        { label: 'Team', href: `/${activeCollective.slug}/admin/members` },
        { label: 'Payment Methods', href: `/${activeCollective.slug}/admin/payment-methods` },
        { label: 'Payment Receipts', href: `/${activeCollective.slug}/admin/payment-receipts` },
        { label: 'Tiers', href: `/${activeCollective.slug}/admin/tiers-revamp` },
        { label: 'Gift Cards', href: `/${activeCollective.slug}/admin/gift-cards` },
        { label: 'Webhooks', href: `/${activeCollective.slug}/admin/webhooks` },
        { label: 'Activity Log', href: `/${activeCollective.slug}/admin/activity-log` },
        { label: 'Security', href: `/${activeCollective.slug}/admin/security` },
        { label: 'Advanced', href: `/${activeCollective.slug}/admin/advanced` },
        { label: 'Fiscal Host Settings', icon: <Building size="16" /> },
        { label: 'Fiscal Hosting', href: `/${activeCollective.slug}/admin/fiscal-hosting` },
        { label: 'Invoices & Receipts', href: `/${activeCollective.slug}/admin/invoices-receipts` },
        { label: 'Receiving Money', href: `/${activeCollective.slug}/admin/receiving-money` },
        { label: 'Sending Money', href: `/${activeCollective.slug}/admin/sending-money` },
        { label: 'Virtual Cards', href: `/${activeCollective.slug}/admin/host-virtual-cards-settings` },
        { label: 'Policies', href: `/${activeCollective.slug}/admin/policies` },
      ]
    : [];

  const settings =
    activeCollective?.type === 'ORGANIZATION'
      ? fiscalHostSettings
      : activeCollective?.type === 'COLLECTIVE'
      ? collectiveSettings
      : userSettings;

  const membershipsThatICanHaveAsContext = LoggedInUser?.memberOf.filter(
    m => m.role === 'ADMIN' || m.role === 'MEMBER',
  );
  useEffect(() => {

    if (!activeCollective) return;
    const isUserSettings =
      (activeCollective.type === 'USER' || activeCollective.type === 'COLLECTIVE') &&
      router.asPath === `/${activeCollective.slug}/admin`;
    if (router.asPath === `/${activeCollective.slug}/admin`) {
      router.push(
        activeCollective.type === 'ORGANIZATION'
          ? `/${activeCollective.slug}/admin/expenses`
          : `/${activeCollective.slug}/admin/info`,
        null,
        { shallow: true },
      );
    }
    const isPathInSettings = settings.some(s => router.asPath.includes(s.href));

    if (isPathInSettings || isUserSettings) {
      setShowSettingsMenu(true);
    } else {
      setShowSettingsMenu(false);
    }

    // if new path is part of a collective I am member of, then set active collective
    const possibleCollectiveSlug = router.asPath.split('/')[1];

    if (possibleCollectiveSlug !== activeCollective.slug) {
      if (possibleCollectiveSlug === LoggedInUser?.collective.slug) {
        setActiveCollective({ ...LoggedInUser.collective, role: 'Personal profile' });
      } else if (membershipsThatICanHaveAsContext) {
        const membership = membershipsThatICanHaveAsContext.find(m => m.collective.slug === possibleCollectiveSlug);
        if (membership) {
          setActiveCollective({ ...membership.collective, role: membership.role });
        }
      }
    }
  }, [router.asPath]);

  return (
    <Slider show={!!LoggedInUser}>
      <SidebarContainer>
        {activeCollective && LoggedInUser && (
          <React.Fragment>
            {/* <Flex flexDirection="column"> */}
            <Flex py={0} flexDirection="column" gap="4px">
              {showSettingsMenu ? (
                <React.Fragment>
                  <Flex py={0} flexDirection="column" gap="4px">
                    <Box mb={2}>
                      <StyledNavLink href={`/${activeCollective.slug}`}>
                        <ArrowLeft size="18" />
                        <Span fontSize="16px" fontWeight="500" color="black.900">
                          Back
                        </Span>
                      </StyledNavLink>
                    </Box>
                    {settings.map((item, index) => {
                      const active = router.asPath === item.href;

                      if (!item.href) {
                        return (
                          <NavLabel>
                            {item.icon} {item.label}
                          </NavLabel>
                        );
                      }
                      return (
                        <div key={item.label} style={{ marginLeft: '30px' }}>
                          <StyledNavLink key={item.href} href={item.href} active={active}>
                            <span>{item.label}</span>
                          </StyledNavLink>
                        </div>
                      );
                    })}
                  </Flex>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Flex px={2}>
                    <Image width="36" height="36" src="/static/images/opencollective-icon.png" alt="Open Collective" />
                  </Flex>
                  <Flex py={4} flexDirection="column" gap="4px">
                    {pages.map(page => {
                      const active = router.asPath === page.href;

                      return (
                        <StyledNavLink key={page.href} href={page.href} active={active}>
                          {page.icon} <span>{page.label}</span>
                        </StyledNavLink>
                      );
                    })}
                  </Flex>
                </React.Fragment>
              )}
            </Flex>
            <SideBarProfileMenu setActiveCollective={setActiveCollective} activeCollective={activeCollective} />
            {/* </Flex> */}
          </React.Fragment>
        )}
      </SidebarContainer>
    </Slider>
  );
};

const Page = ({
  children,
  data = {},
  description,
  image,
  loadingLoggedInUser,
  LoggedInUser,
  title,
  metaTitle,
  noRobots,
  twitterHandle,
  showSearch,
  canonicalURL,
  collective,
  menuItems,
  showFooter = true,
  showProfileAndChangelogMenu = true,
}) => {
  if (data.error) {
    return <ErrorPage data={data} LoggedInUser={LoggedInUser} />;
  }

  const childProps = { LoggedInUser, loadingLoggedInUser };

  return (
    <Main>
      <div>
        <Header
          showSearch={showSearch}
          title={title}
          noRobots={noRobots}
          twitterHandle={twitterHandle}
          description={description}
          image={image}
          metaTitle={metaTitle}
          canonicalURL={canonicalURL}
          collective={collective}
          menuItems={menuItems}
          LoggedInUser={LoggedInUser}
          showProfileAndChangelogMenu={showProfileAndChangelogMenu}
        />

        <Body>{typeof children === 'function' ? children(childProps) : children}</Body>
      </div>
      {showFooter && <Footer />}
    </Main>
  );
};

Page.displayName = 'Page';

Page.propTypes = {
  data: PropTypes.shape({
    error: PropTypes.shape({}),
  }),
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  description: PropTypes.string,
  canonicalURL: PropTypes.string,
  image: PropTypes.string,
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.shape({}),
  showSearch: PropTypes.bool,
  noRobots: PropTypes.bool,
  title: PropTypes.string,
  metaTitle: PropTypes.string,
  twitterHandle: PropTypes.string,
  collective: PropTypes.object,
  menuItems: PropTypes.object,
  showFooter: PropTypes.bool,
  showProfileAndChangelogMenu: PropTypes.bool,
};

Page.defaultProps = {
  showSearch: true,
};

export default withUser(Page);
