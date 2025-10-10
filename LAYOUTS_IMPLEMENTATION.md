# Layout Implementation Summary

## What Changed

### 1. Modified `pages/_app.js`

The main app component now supports per-page layouts through a `getLayout` function:

```javascript
// Use the layout defined at the page level, if available
const getLayout = Component.getLayout || (page => page);

// In the render method
{
  getLayout(<Component {...pageProps} />);
}
```

**Before:** All pages were automatically wrapped in `DashboardLayout`
**After:** Each page can define its own layout (or have no layout)

### 2. Updated `pages/dashboard.tsx`

The dashboard page now explicitly defines its layout:

```typescript
DashboardPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
```

### 3. Created New Layout Components

#### `components/layouts/DefaultLayout.tsx`

- Standard layout with header and footer
- Suitable for marketing pages, help pages, etc.
- Configurable title, footer visibility, and metadata

#### `components/layouts/MinimalLayout.tsx`

- Minimal centered layout
- Ideal for authentication flows (sign-in, sign-up, password reset)
- No header or footer

#### `components/layouts/index.ts`

- Central export point for all layouts
- Simplifies imports across the application

## Usage Guide

### Dashboard Pages

For pages that need the full dashboard sidebar and navigation:

```typescript
import DashboardLayout from '@/components/dashboard/Layout';

const MyDashboardPage = () => {
  return <div>Dashboard content</div>;
};

MyDashboardPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default MyDashboardPage;
```

### Standard Pages

For pages that need header and footer but not dashboard navigation:

```typescript
import { DefaultLayout } from '@/components/layouts';

const MyPage = () => {
  return <div>Page content</div>;
};

MyPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      title="My Page Title"
      pageTitle="My Page"
      showFooter={true}
    >
      {page}
    </DefaultLayout>
  );
};

export default MyPage;
```

### Authentication Pages

For sign-in, sign-up, and similar flows:

```typescript
import { MinimalLayout } from '@/components/layouts';

const SignInPage = () => {
  return <div>Sign in form</div>;
};

SignInPage.getLayout = function getLayout(page: React.ReactElement) {
  return <MinimalLayout>{page}</MinimalLayout>;
};

export default SignInPage;
```

### Pages Without Layout

For completely custom pages (like embeds, iframes, etc.):

```typescript
const BareMinimumPage = () => {
  return <div>Just the page content, nothing else</div>;
};

// No getLayout function needed!
export default BareMinimumPage;
```

## Benefits

1. **Flexibility**: Different sections of the app can have completely different UX
2. **Performance**: Only load layout components when needed
3. **Developer Experience**: Clear separation of concerns
4. **Maintainability**: Easy to understand which pages use which layouts
5. **Progressive Migration**: Existing pages continue to work, can be migrated gradually

## Layout Comparison

| Layout              | Use Case              | Features                          | Examples                            |
| ------------------- | --------------------- | --------------------------------- | ----------------------------------- |
| **DashboardLayout** | Admin/Dashboard pages | Sidebar, account switcher, search | `/dashboard`, `/dashboard/[slug]/*` |
| **DefaultLayout**   | Standard pages        | Header, footer, page wrapper      | `/help-and-support`, `/search`      |
| **MinimalLayout**   | Auth flows            | Centered content, no chrome       | `/signin`, `/reset-password`        |
| **No Layout**       | Special pages         | Complete control                  | Embeds, iframes, special flows      |

## Migration Strategy

### Immediate Changes

- ✅ Dashboard pages now use `DashboardLayout` explicitly
- ✅ Other pages default to no layout (existing behavior maintained)

### Recommended Next Steps

1. **Identify Layout Needs**: Review existing pages and categorize by layout type
2. **Migrate Authentication Pages**: Convert sign-in, sign-up, password reset to `MinimalLayout`
3. **Migrate Standard Pages**: Convert help, search, and other pages to `DefaultLayout`
4. **Test Each Migration**: Ensure functionality and styling remain correct
5. **Clean Up Legacy Code**: Remove old layout wrappers from individual pages

### Example Migration Pattern

**Before (old pattern in individual page):**

```typescript
const MyPage = () => {
  return (
    <div>
      <Header />
      <Body>
        <div>Content here</div>
      </Body>
      <Footer />
    </div>
  );
};
```

**After (new pattern with layout):**

```typescript
import { DefaultLayout } from '@/components/layouts';

const MyPage = () => {
  return <div>Content here</div>;
};

MyPage.getLayout = function getLayout(page) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
```

## TypeScript Support

For full TypeScript support, you can define a custom Next.js page type:

```typescript
import type { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};
```

Then use it in your pages:

```typescript
import type { NextPageWithLayout } from '@/lib/types';

const MyPage: NextPageWithLayout = () => {
  return <div>Content</div>;
};

MyPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};
```

## Additional Resources

- See `docs/layouts.md` for detailed documentation
- See `components/layouts/` for layout implementations
- See `pages/dashboard.tsx` for a complete example

## Questions & Support

For questions about layouts:

1. Check the documentation in `docs/layouts.md`
2. Review existing implementations in the codebase
3. Look at the layout components in `components/layouts/`
