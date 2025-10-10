/**
 * Type definitions for per-page layouts pattern
 */

import type { NextComponentType, NextPage, NextPageContext } from 'next';
import type { AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';

/**
 * Enhanced Next.js page type that supports per-page layouts
 *
 * @example
 * ```typescript
 * import type { NextPageWithLayout } from '@/lib/types/layout';
 * import { DashboardLayout } from '@/components/layouts';
 *
 * const MyPage: NextPageWithLayout = () => {
 *   return <div>Content</div>;
 * };
 *
 * MyPage.getLayout = function getLayout(page) {
 *   return <DashboardLayout>{page}</DashboardLayout>;
 * };
 *
 * export default MyPage;
 * ```
 */
export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<P, IP> & {
  /**
   * Optional function to wrap the page in a layout component.
   * If not provided, the page will render without any layout wrapper.
   *
   * @param page - The page component to be wrapped
   * @returns The page wrapped in a layout
   */
  getLayout?: (page: ReactElement) => ReactNode;
};

/**
 * Type for the Component prop in AppProps that includes layout support
 */
export type NextPageWithLayoutType<P = any, IP = P> = NextComponentType<NextPageContext, IP, P> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

/**
 * Enhanced AppProps that includes layout support
 */
export type AppPropsWithLayout<P = any> = AppProps<P> & {
  Component: NextPageWithLayoutType<P>;
};

/**
 * Props interface for layout components
 */
export interface LayoutProps {
  /** The page content to be rendered within the layout */
  children: ReactNode;
}
