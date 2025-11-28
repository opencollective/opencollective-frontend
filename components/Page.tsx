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
    error?: object;
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
  collective?: object;
  showMenuItems?: boolean;
  showFooter?: boolean;
  showProfileAndChangelogMenu?: boolean;
  loading?: boolean;
  withTopBar?: boolean;
  updatesRss?: boolean;
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
  showSearch = true,
  canonicalURL,
  collective,
  showMenuItems = true,
  withTopBar = true,
  showFooter = true,
  showProfileAndChangelogMenu = true,
  loading,
  updatesRss,
}: PageProps) => {
  if (data.error) {
    return <ErrorPage data={data} LoggedInUser={LoggedInUser} />;
  }

  const childProps = { LoggedInUser, loadingLoggedInUser };
  return (
    <div className="flex min-h-screen flex-col">
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
        showMenuItems={showMenuItems}
        LoggedInUser={LoggedInUser}
        showProfileAndChangelogMenu={showProfileAndChangelogMenu}
        loading={loading}
        withTopBar={withTopBar}
        updatesRss={updatesRss}
      />
      <Body className="flex-1">{typeof children === 'function' ? children(childProps) : children}</Body>
      {showFooter && <Footer />}
    </div>
  );
};

Page.displayName = 'Page';

export default withUser(Page);
