/**
 * This file demonstrates the different layout patterns available in the application.
 *
 * Each example shows how to apply a specific layout to a page component.
 */

import React from 'react';
import type { NextPageWithLayout } from '@/lib/types';
import { DashboardLayout, DefaultLayout, MinimalLayout } from '@/components/layouts';

// ============================================================================
// EXAMPLE 1: Dashboard Layout
// ============================================================================
// Use this for admin/dashboard pages that need the full sidebar navigation

export const DashboardPageExample: NextPageWithLayout = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard Page</h1>
      <p>This page uses the DashboardLayout with sidebar navigation.</p>
    </div>
  );
};

DashboardPageExample.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

// ============================================================================
// EXAMPLE 2: Default Layout
// ============================================================================
// Use this for standard pages that need header and footer

export const StandardPageExample: NextPageWithLayout = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Standard Page</h1>
      <p>This page uses the DefaultLayout with header and footer.</p>
    </div>
  );
};

StandardPageExample.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout title="Standard Page - Open Collective" pageTitle="Standard Page" showFooter={true} noRobots={false}>
      {page}
    </DefaultLayout>
  );
};

// ============================================================================
// EXAMPLE 3: Minimal Layout
// ============================================================================
// Use this for authentication pages or simple centered flows

export const AuthPageExample: NextPageWithLayout = () => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-4 text-2xl font-bold">Sign In</h1>
      <p className="text-slate-600">This page uses the MinimalLayout - perfect for auth flows.</p>
      <div className="mt-6">
        <input type="email" placeholder="Email" className="w-full rounded border border-slate-300 px-4 py-2" />
        <button className="mt-4 w-full rounded bg-blue-600 px-4 py-2 text-white">Sign In</button>
      </div>
    </div>
  );
};

AuthPageExample.getLayout = function getLayout(page: React.ReactElement) {
  return <MinimalLayout>{page}</MinimalLayout>;
};

// ============================================================================
// EXAMPLE 4: No Layout
// ============================================================================
// Use this for special pages that need complete control (embeds, iframes, etc.)

export const NoLayoutExample: NextPageWithLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8">
        <h1 className="text-2xl font-bold">No Layout</h1>
        <p className="mt-4">This page has no layout wrapper - complete control over the entire page.</p>
        <p className="mt-2 text-slate-600">Perfect for embeds, iframes, or pages with unique designs.</p>
      </div>
    </div>
  );
};

// No getLayout function = no layout wrapper

// ============================================================================
// EXAMPLE 5: Custom Layout (inline)
// ============================================================================
// You can also define a custom layout inline if needed

export const CustomLayoutExample: NextPageWithLayout = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Custom Layout</h1>
      <p>This page uses a custom inline layout.</p>
    </div>
  );
};

CustomLayoutExample.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white p-4">
        <h1 className="text-xl font-bold">Custom Header</h1>
      </header>
      <main className="container mx-auto py-8">{page}</main>
      <footer className="border-t border-slate-200 bg-white p-4 text-center text-sm text-slate-600">
        Custom Footer
      </footer>
    </div>
  );
};

// ============================================================================
// CHOOSING THE RIGHT LAYOUT
// ============================================================================
//
// 1. DashboardLayout - For admin/management pages
//    ✓ Sidebar navigation
//    ✓ Account switcher
//    ✓ Search functionality
//    Examples: /dashboard, /dashboard/[slug]/expenses
//
// 2. DefaultLayout - For standard content pages
//    ✓ Header with navigation
//    ✓ Footer
//    ✓ Configurable metadata
//    Examples: /help-and-support, /search, /solutions
//
// 3. MinimalLayout - For focused flows
//    ✓ Centered content
//    ✓ No distractions
//    ✓ Clean design
//    Examples: /signin, /reset-password, /confirm-email
//
// 4. No Layout - For special cases
//    ✓ Complete control
//    ✓ Custom design
//    ✓ Embeds/iframes
//    Examples: /embed/*, /banner-iframe, /collectives-iframe
//
