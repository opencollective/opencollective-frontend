import React from 'react';
import { getContrast } from 'polished';

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
  /** Brand color (hex) used as the `--primary` color of the page's UI elements */
  primaryColor?: string;
}

/**
 * [POC] Turns a collective's brand color (`settings.collectivePage.primaryColor`) into
 * CSS variable overrides applied on the page's `<main>` wrapper, so that all UI elements
 * using `--primary` (buttons, links, checkboxes, focus rings...) pick it up. Returns
 * `undefined` when no valid color is set, keeping the default theme.
 */
const getThemeStyle = (primaryColor?: string): React.CSSProperties | undefined => {
  if (!primaryColor || !/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(primaryColor)) {
    return undefined;
  }
  return {
    '--primary': primaryColor,
    '--primary-foreground': getContrast(primaryColor, '#ffffff') >= 4.5 ? '#ffffff' : 'var(--color-slate-900)',
    '--ring': primaryColor,
  } as React.CSSProperties;
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
  showSearch = true,
  canonicalURL,
  collective,
  showMenuItems = true,
  withTopBar = true,
  showFooter = true,
  showProfileAndChangelogMenu = true,
  loading,
  updatesRss,
  primaryColor,
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
      <Body className="flex-1" style={getThemeStyle(primaryColor)}>
        {typeof children === 'function' ? children(childProps) : children}
      </Body>
      {showFooter && <Footer />}
    </div>
  );
};

Page.displayName = 'Page';

export default withUser(Page);
