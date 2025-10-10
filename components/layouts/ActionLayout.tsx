import React from 'react';
import ProfileMenu from '../navigation/ProfileMenu';

interface ActionLayoutProps {
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
export default function ActionLayout({ children, collective, title, pageTitle, noRobots = false }: ActionLayoutProps) {
  console.log({ title });
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-15 w-full max-w-(--breakpoint-xl) items-center justify-between gap-3">
        <p>{title}</p>
        <ProfileMenu />
      </header>
      <main>{children}</main>
    </div>
  );
}
