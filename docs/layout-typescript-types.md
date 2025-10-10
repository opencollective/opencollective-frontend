# TypeScript Types for Per-Page Layouts

## Overview

We provide several TypeScript types to support the per-page layouts pattern. These types are exported from `@/lib/types`.

## Available Types

### 1. `NextPageWithLayout`

For **function components** that use layouts.

```typescript
import type { NextPageWithLayout } from '@/lib/types';

const MyPage: NextPageWithLayout = () => {
  return <div>Content</div>;
};

MyPage.getLayout = (page) => <Layout>{page}</Layout>;

export default MyPage;
```

**When to use:**

- ✅ Function components
- ✅ Pages without HOCs
- ✅ Modern React patterns

---

### 2. `NextPageWithLayoutType`

For **HOC-wrapped components** or **class components** that use layouts.

```typescript
import type { NextPageWithLayoutType } from '@/lib/types';

// Class component
class MyPage extends React.Component {
  render() {
    return <div>Content</div>;
  }
}

// HOC-wrapped component
const MyPageWithLayout: NextPageWithLayoutType = withUser(withRouter(MyPage));

// Now TypeScript knows getLayout is allowed
MyPageWithLayout.getLayout = (page) => <Layout>{page}</Layout>;

export default MyPageWithLayout;
```

**When to use:**

- ✅ Class components
- ✅ Components wrapped with `withRouter`
- ✅ Components wrapped with `withUser`
- ✅ Any HOC-wrapped components

---

### 3. `AppPropsWithLayout`

For the `_app.js` component to support layout-aware pages.

```typescript
import type { AppPropsWithLayout } from '@/lib/types';

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout || ((page) => page);
  return getLayout(<Component {...pageProps} />);
}
```

**When to use:**

- ✅ Only in `_app.js` or `_app.tsx`

---

### 4. `LayoutProps`

For creating layout components.

```typescript
import type { LayoutProps } from '@/lib/types';

export default function MyLayout({ children }: LayoutProps) {
  return (
    <div>
      <header>Header</header>
      <main>{children}</main>
      <footer>Footer</footer>
    </div>
  );
}
```

**When to use:**

- ✅ Creating new layout components

---

## Common Patterns

### Function Component (Recommended)

```typescript
import type { NextPageWithLayout } from '@/lib/types';
import { DefaultLayout } from '@/components/layouts';

const HomePage: NextPageWithLayout = () => {
  return <div>Welcome!</div>;
};

HomePage.getLayout = (page) => (
  <DefaultLayout title="Home">{page}</DefaultLayout>
);

export default HomePage;
```

### Class Component

```typescript
import type { NextPageWithLayoutType } from '@/lib/types';
import { DefaultLayout } from '@/components/layouts';

class OldPage extends React.Component {
  render() {
    return <div>Old page</div>;
  }
}

const OldPageWithLayout: NextPageWithLayoutType = OldPage;

OldPageWithLayout.getLayout = (page) => (
  <DefaultLayout>{page}</DefaultLayout>
);

export default OldPageWithLayout;
```

### HOC-Wrapped Component

```typescript
import type { NextPageWithLayoutType } from '@/lib/types';
import { MinimalLayout } from '@/components/layouts';
import { withRouter } from 'next/router';
import { withUser } from '@/components/UserProvider';

class AuthPage extends React.Component {
  render() {
    return <div>Auth page</div>;
  }
}

// Assign to a typed constant BEFORE adding getLayout
const AuthPageWithLayout: NextPageWithLayoutType = withUser(withRouter(AuthPage));

// Now TypeScript allows getLayout
AuthPageWithLayout.getLayout = (page) => (
  <MinimalLayout>{page}</MinimalLayout>
);

export default AuthPageWithLayout;
```

### With getInitialProps or getServerSideProps

```typescript
import type { NextPageWithLayout } from '@/lib/types';
import type { GetServerSideProps } from 'next';

type Props = {
  data: string;
};

const Page: NextPageWithLayout<Props> = ({ data }) => {
  return <div>{data}</div>;
};

Page.getLayout = (page) => <Layout>{page}</Layout>;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return {
    props: {
      data: 'Hello',
    },
  };
};

export default Page;
```

## Type Definitions

The types are defined in `lib/types/layout.ts`:

```typescript
// For function components
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

// For HOC-wrapped or class components
export type NextPageWithLayoutType<P = any, IP = P> = NextComponentType<NextPageContext, IP, P> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

// For _app.js
export type AppPropsWithLayout<P = any> = AppProps<P> & {
  Component: NextPageWithLayoutType<P>;
};

// For layout components
export interface LayoutProps {
  children: ReactNode;
}
```

## Troubleshooting

### Error: "Property 'getLayout' does not exist"

**Problem:** TypeScript doesn't know the component can have `getLayout`.

**Solution:** Use the correct type:

- For function components: `NextPageWithLayout`
- For HOC-wrapped/class components: `NextPageWithLayoutType`

```typescript
// ❌ Bad
const Page = withRouter(MyComponent);
Page.getLayout = ... // Error!

// ✅ Good
const Page: NextPageWithLayoutType = withRouter(MyComponent);
Page.getLayout = ... // Works!
```

### Error: "Type 'X' is not assignable to type 'NextPageWithLayout'"

**Problem:** The component type doesn't match `NextPageWithLayout`.

**Solution:** Use `NextPageWithLayoutType` for wrapped/class components:

```typescript
// ❌ Bad
const Page: NextPageWithLayout = withRouter(MyComponent);

// ✅ Good
const Page: NextPageWithLayoutType = withRouter(MyComponent);
```

### Mixing Types

Different pages can use different types based on their structure:

```typescript
// pages/home.tsx - Function component
export const Home: NextPageWithLayout = () => ...

// pages/dashboard.tsx - Function component
export const Dashboard: NextPageWithLayout = () => ...

// pages/signin.tsx - HOC-wrapped class component
export const SignIn: NextPageWithLayoutType = withUser(withRouter(...))
```

## Best Practices

1. **Prefer `NextPageWithLayout`** for new function components
2. **Use `NextPageWithLayoutType`** for legacy class components or HOC-wrapped components
3. **Type the component constant** before adding `getLayout`
4. **Import types from `@/lib/types`** for consistency
5. **Add types incrementally** - not all pages need them immediately

## Examples in the Codebase

- **Function component with layout**: `pages/dashboard.tsx`
- **HOC-wrapped component with layout**: `pages/signin.tsx`
- **Type definitions**: `lib/types/layout.ts`
