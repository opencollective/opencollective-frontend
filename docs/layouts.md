# Per-Page Layouts Pattern

This project uses the **per-page layouts pattern** recommended by Next.js to apply different layouts to different routes.

## How It Works

Instead of wrapping all pages with a single layout in `_app.js`, we allow each page to define its own layout through a `getLayout` function. This provides flexibility to have different layouts for different sections of the application.

## Implementation

### 1. App Configuration (\_app.js)

The `_app.js` file has been updated to support per-page layouts:

```javascript
// In the render method
const getLayout = Component.getLayout || (page => page);

return (
  <Fragment>
    {/* ... providers ... */}
    {getLayout(<Component {...pageProps} />)}
    {/* ... */}
  </Fragment>
);
```

If a page doesn't define a `getLayout` function, it will render without any layout wrapper (default behavior).

### 2. Available Layouts

#### DashboardLayout

For admin/dashboard pages with sidebar navigation.

**Location:** `components/dashboard/Layout.tsx`

**Features:**

- Sidebar navigation
- Account switcher
- Search functionality
- Profile menu

#### DefaultLayout

For standard pages with header and footer.

**Location:** `components/layouts/DefaultLayout.tsx`

**Features:**

- Page component wrapper
- Footer
- Configurable title and metadata

#### MinimalLayout

For authentication pages or simple flows.

**Location:** `components/layouts/MinimalLayout.tsx`

**Features:**

- Centered content
- No header/footer
- Minimal styling

## Usage Examples

### Dashboard Pages

```typescript
// pages/dashboard.tsx
import DashboardLayout from '@/components/dashboard/Layout';

const DashboardPage = () => {
  return <div>Dashboard content</div>;
};

// Apply DashboardLayout to this page
DashboardPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardPage;
```

### Standard Pages with Header/Footer

```typescript
// pages/some-page.tsx
import { DefaultLayout } from '@/components/layouts';

const SomePage = () => {
  return <div>Page content</div>;
};

// Apply DefaultLayout to this page
SomePage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      title="Page Title"
      pageTitle="Page Title"
      showFooter={true}
    >
      {page}
    </DefaultLayout>
  );
};

export default SomePage;
```

### Authentication/Minimal Pages

```typescript
// pages/signin.tsx
import { MinimalLayout } from '@/components/layouts';

const SignInPage = () => {
  return <div>Sign in form</div>;
};

// Apply MinimalLayout to this page
SignInPage.getLayout = function getLayout(page: React.ReactElement) {
  return <MinimalLayout>{page}</MinimalLayout>;
};

export default SignInPage;
```

### Pages Without a Layout

If you want a page to have no layout at all (no wrapper), simply don't define `getLayout`:

```typescript
// pages/bare-page.tsx
const BarePage = () => {
  return <div>Completely bare page</div>;
};

export default BarePage;
```

## Creating Custom Layouts

To create a new layout:

1. Create a new component in `components/layouts/`
2. Export it from `components/layouts/index.ts`
3. Use it with the `getLayout` pattern on your pages

Example:

```typescript
// components/layouts/CustomLayout.tsx
import React from 'react';

interface CustomLayoutProps {
  children: React.ReactNode;
}

export default function CustomLayout({ children }: CustomLayoutProps) {
  return (
    <div>
      <header>Custom Header</header>
      <main>{children}</main>
      <footer>Custom Footer</footer>
    </div>
  );
}
```

## Benefits

1. **Flexibility**: Different pages can have completely different layouts
2. **Performance**: Only load layout code needed for specific pages
3. **Maintainability**: Layout logic is co-located with pages that use it
4. **Type Safety**: TypeScript support for layout props
5. **Shared State**: Layouts can maintain their own state across page navigations

## Migration Strategy

When migrating existing pages:

1. Identify which layout the page should use
2. Add the `getLayout` function to the page
3. Remove any layout wrapper code from the page itself
4. Test the page to ensure it renders correctly

## TypeScript Support

For TypeScript pages, you can type the layout function:

```typescript
import type { ReactElement } from 'react';
import type { NextPageWithLayout } from '@/lib/types';

const Page: NextPageWithLayout = () => {
  return <div>Content</div>;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Page;
```

### For HOC-Wrapped Components

If your page is wrapped with Higher-Order Components (like `withRouter`, `withUser`, etc.), use `NextPageWithLayoutType`:

```typescript
import type { NextPageWithLayoutType } from '@/lib/types';

class MyPage extends React.Component {
  render() {
    return <div>Content</div>;
  }
}

// Type the wrapped component
const MyPageWithLayout: NextPageWithLayoutType = withUser(withRouter(MyPage));

// Now you can safely add getLayout
MyPageWithLayout.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default MyPageWithLayout;
```
