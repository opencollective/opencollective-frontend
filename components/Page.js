import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { themeGet } from '@styled-system/theme-get';
import { BroadActivityFeed } from '@styled-icons/fluentui-system-regular/BroadActivityFeed';
import { SettingsOutline } from '@styled-icons/evaicons-outline/SettingsOutline';
import { Settings } from '@styled-icons/feather/settings';
import { Grid } from '@styled-icons/feather/Grid';
import { GridOutline } from '@styled-icons/evaicons-outline/GridOutline';
import { ViewGrid } from '@styled-icons/heroicons-outline/ViewGrid';
import { CreditCard } from '@styled-icons/heroicons-outline/CreditCard';
import { Cog } from '@styled-icons/heroicons-outline/Cog';
import { Template } from '@styled-icons/heroicons-outline/Template';
import { useRouter } from 'next/router';
import Image from '../components/Image';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';

import Body from '../components/Body';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { Flex } from '../components/Grid';
import Link from '../components/Link';
import SideBarProfileMenu from './SideBarProfileMenu';
import { withUser } from './UserProvider';

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
overflow: hidden;`;
const Main = styled.div`
  flex-grow: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 24px;
`;

const Top = styled.div``;

const StyledNavLink = styled(Link)`
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  letter-spacing: 0;
  border-radius: 4px;
  padding: 10px 12px;
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

    background: #e8edf4;
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

const userPages = slug => [
  { label: 'Profile page', href: `/${slug}`, icon: <Template size="16" /> },
  { label: 'Contributions', href: `/${slug}/recurring-contributions`, icon: <CircleStack size="16" /> },
  { label: 'Transactions', href: `/${slug}/transactions`, icon: <Wallet size="16" /> },
  { label: 'Applications', href: `/applications`, icon: <ViewGrid size="16" /> },
  { label: 'Settings', href: `/${slug}/admin`, icon: <Cog size="16" />, subMenu: true },
];

const orgPages = slug => [
  { label: 'Profile page', href: `/${slug}`, icon: <Template size="16" /> },
  { label: 'Expenses', href: `/${slug}/admin/expenses`, icon: <CircleStack size="16" /> },
  { label: 'Financial Contributions', href: `/${slug}/admin/orders`, icon: <Wallet size="16" /> },
  { label: 'Pending Applications', href: `/${slug}/admin/pending-applications`, icon: <ViewGrid size="16" /> },
  { label: 'Hosted Collectives', href: `/${slug}/admin/hosted-collectives`, icon: <ViewGrid size="16" /> },

  { label: 'Virtual Cards', href: `/${slug}/admin/host-virtual-cards`, icon: <CreditCard size="16" /> },
  { label: 'Reports', href: `/${slug}/admin/reports`, icon: <ViewGrid size="16" /> },
  { label: 'Settings', href: `/${slug}/admin/info`, icon: <Cog size="16" /> },

  // { label: 'Fiscal Host Settings', href: `/${slug}/admin/fiscal-hosting`, icon: <Cog size="16" /> },
];

const collectivePages = slug => [
  { label: 'Profile page', href: `/${slug}`, icon: <Template size="16" /> },
  { label: 'Expenses', href: `/${slug}/expenses`, icon: <CircleStack size="16" /> },
  { label: 'Transactions', href: `/${slug}/transactions`, icon: <Wallet size="16" /> },
  { label: 'Team', href: `/${slug}/admin/members`, icon: <ViewGrid size="16" /> },
  { label: 'Virtual Cards', href: `/${slug}/admin/virtual-cards`, icon: <CreditCard size="16" /> },
  { label: 'Settings', href: `/${slug}/admin`, icon: <Cog size="16" /> },
];

export const Sidebar = () => {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();

  const [activeCollective, setActiveCollective] = React.useState(null);
  useEffect(() => {
    if (LoggedInUser) {
      setActiveCollective({ ...LoggedInUser.collective, type: 'USER', role: 'Personal profile' });
    }
  }, [LoggedInUser]);
  //if (!LoggedInUser || !activeCollective) return null;
  // console.log({ activeCollective });

  const pages = activeCollective
    ? activeCollective?.type === 'USER'
      ? userPages(activeCollective.slug)
      : activeCollective?.type === 'ORGANIZATION'
      ? orgPages(activeCollective.slug)
      : collectivePages(activeCollective.slug)
    : [];
  return (
    <Slider show={!!LoggedInUser}>
      <SidebarContainer>
        {activeCollective && LoggedInUser && (
          <React.Fragment>
            <Flex flexDirection="column">
              <Flex px={2}>
                <Image width="36" height="36" src="/static/images/opencollective-icon.png" alt="Open Collective" />
              </Flex>
              <Flex py={4} flexDirection="column" gap="4px">
                {pages.map(page => {
                  const active = router.asPath === page.href;

                  console.log({ active, router, page });
                  return (
                    <StyledNavLink key={page.href} href={page.href} active={active}>
                      {page.icon} <span>{page.label}</span>
                    </StyledNavLink>
                  );
                })}
              </Flex>
            </Flex>
            <SideBarProfileMenu setActiveCollective={setActiveCollective} activeCollective={activeCollective} />
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
