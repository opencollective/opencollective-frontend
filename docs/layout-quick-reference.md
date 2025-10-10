# Layout Quick Reference

## 🚀 Quick Start

### Option 1: Use DashboardLayout

```typescript
import DashboardLayout from '@/components/dashboard/Layout';

const Page = () => <div>Content</div>;
Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default Page;
```

### Option 2: Use DefaultLayout

```typescript
import { DefaultLayout } from '@/components/layouts';

const Page = () => <div>Content</div>;
Page.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>;
export default Page;
```

### Option 3: Use MinimalLayout

```typescript
import { MinimalLayout } from '@/components/layouts';

const Page = () => <div>Content</div>;
Page.getLayout = (page) => <MinimalLayout>{page}</MinimalLayout>;
export default Page;
```

### Option 4: No Layout

```typescript
const Page = () => <div>Content</div>;
export default Page;
```

## 📋 Layout Cheat Sheet

| Layout              | Import                          | When to Use    | Features                          |
| ------------------- | ------------------------------- | -------------- | --------------------------------- |
| **DashboardLayout** | `@/components/dashboard/Layout` | Admin pages    | Sidebar, Account switcher, Search |
| **DefaultLayout**   | `@/components/layouts`          | Standard pages | Header, Footer, Page wrapper      |
| **MinimalLayout**   | `@/components/layouts`          | Auth flows     | Centered, Clean, No chrome        |
| **No Layout**       | (none)                          | Special pages  | Full control                      |

## 🎯 Common Patterns

### With TypeScript

```typescript
import type { NextPageWithLayout } from '@/lib/types';

const Page: NextPageWithLayout = () => <div>Content</div>;
Page.getLayout = (page) => <Layout>{page}</Layout>;
```

### With Props

```typescript
Page.getLayout = (page) => (
  <DefaultLayout
    title="Page Title"
    showFooter={true}
  >
    {page}
  </DefaultLayout>
);
```

### Custom Layout

```typescript
Page.getLayout = (page) => (
  <div>
    <header>Header</header>
    <main>{page}</main>
    <footer>Footer</footer>
  </div>
);
```

## 📁 File Locations

- **DashboardLayout**: `components/dashboard/Layout.tsx`
- **DefaultLayout**: `components/layouts/DefaultLayout.tsx`
- **MinimalLayout**: `components/layouts/MinimalLayout.tsx`
- **Layout Types**: `lib/types/layout.ts`
- **Examples**: `examples/layout-patterns.tsx`
- **Docs**: `docs/layouts.md`

## 🔍 Finding Examples

- Dashboard: `pages/dashboard.tsx`
- Auth: `pages/signin.tsx` (can be migrated)
- Standard: Most marketing pages
- No Layout: `pages/embed/*`
