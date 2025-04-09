import React from 'react';

import type LoggedInUser from '../lib/LoggedInUser';

import Footer from './navigation/Footer';
import Body from './Body';
import ErrorPage from './ErrorPage';
import Header from './Header';
import { withUser } from './UserProvider';

type LoggedInUserInfo = {
  loadingLoggedInUser: boolean;
  LoggedInUser: typeof LoggedInUser;
};

interface PageProps {
  data?: {
    error?: {};
  };
  children?: React.ReactNode | ((info: LoggedInUserInfo) => React.ReactNode);
  description?: string;
  canonicalURL?: string;
  image?: string;
  loadingLoggedInUser?: boolean;
  LoggedInUser?: typeof LoggedInUser;
  showSearch?: boolean;
  noRobots?: boolean;
  title?: string;
  metaTitle?: string;
  twitterHandle?: string;
  identity?: string;
  collective?: object;
  menuItems?: object;
  showHeader?: boolean;
  showFooter?: boolean;
  showProfileAndChangelogMenu?: boolean;
  loading?: boolean;
  withTopBar?: boolean;
}

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
  identity,
  showSearch = true,
  canonicalURL,
  collective,
  menuItems,
  withTopBar = true,
  showHeader = true,
  showFooter = true,
  showProfileAndChangelogMenu = true,
  loading,
}: PageProps) => {
  if (data.error) {
    return <ErrorPage data={data} LoggedInUser={LoggedInUser} />;
  }

  const childProps = { LoggedInUser, loadingLoggedInUser };
  return (
    <div>
      {showHeader && (
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
          loading={loading}
          withTopBar={withTopBar}
          identity={identity}
        />
      )}
      <Body>{typeof children === 'function' ? children(childProps) : children}</Body>
      {showFooter && <Footer />}
    </div>
  );
};

Page.displayName = 'Page';

export default withUser(Page);
