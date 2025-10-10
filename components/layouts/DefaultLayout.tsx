import React from 'react';

import Footer from '../navigation/Footer';
import Page from '../Page';

interface DefaultLayoutProps {
  children: React.ReactNode;
  collective?: {
    name?: string;
    slug?: string;
    type?: string;
    isArchived?: boolean;
  };
  title?: string;
  pageTitle?: string;
  showFooter?: boolean;
  noRobots?: boolean;
}

/**
 * Default layout for pages that need a simple header/footer structure
 * without the dashboard sidebar.
 */
export default function DefaultLayout({
  children,
  collective,
  title,
  pageTitle,
  showFooter = true,
  noRobots = false,
}: DefaultLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <Page noRobots={noRobots} collective={collective} title={title} pageTitle={pageTitle} showFooter={false}>
        {children}
      </Page>
      {showFooter && <Footer />}
    </div>
  );
}
