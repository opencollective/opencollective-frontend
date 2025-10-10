# Layout Migration Guide

This guide will help you migrate existing pages to use the new per-page layouts pattern.

## Before You Start

1. Read `docs/layouts.md` for an overview of the pattern
2. Check `docs/layout-quick-reference.md` for quick syntax
3. Review `examples/layout-patterns.tsx` for examples

## Migration Steps

### Step 1: Identify the Page Type

Determine which layout your page should use:

- **Dashboard/Admin pages** → `DashboardLayout`
- **Standard content pages** → `DefaultLayout`
- **Auth/focused flows** → `MinimalLayout`
- **Embeds/special pages** → No layout

### Step 2: Add the Layout

Add the `getLayout` function at the bottom of your page file, before the export.

### Step 3: Remove Old Layout Code

Remove any layout-related code from within your page component.

### Step 4: Test

Test the page to ensure:

- Layout renders correctly
- Navigation works
- Styling is correct
- Functionality is preserved

## Example Migrations

### Example 1: Migrating a Standard Page

**Before:**

```typescript
// pages/help-and-support.js
const HelpPage = () => {
  return (
    <div>
      <Header />
      <Body>
        <div className="container">
          <h1>Help & Support</h1>
          <p>Content here...</p>
        </div>
      </Body>
      <Footer />
    </div>
  );
};

export default HelpPage;
```

**After:**

```typescript
// pages/help-and-support.js
import { DefaultLayout } from '@/components/layouts';

const HelpPage = () => {
  return (
    <div className="container">
      <h1>Help & Support</h1>
      <p>Content here...</p>
    </div>
  );
};

HelpPage.getLayout = function getLayout(page) {
  return (
    <DefaultLayout
      title="Help & Support - Open Collective"
      pageTitle="Help & Support"
    >
      {page}
    </DefaultLayout>
  );
};

export default HelpPage;
```

**Changes:**

- ✅ Added `getLayout` function with `DefaultLayout`
- ✅ Removed `Header`, `Body`, `Footer` from component
- ✅ Simplified component to just content
- ✅ Added page metadata

---

### Example 2: Migrating an Auth Page

**Before:**

```typescript
// pages/signin.tsx
const SignInPage = () => {
  return (
    <div className="LoginPage">
      <Header title="Sign In" />
      <Body>
        <Flex flexDirection="column" alignItems="center">
          <SignInForm />
        </Flex>
      </Body>
    </div>
  );
};

export default SignInPage;
```

**After:**

```typescript
// pages/signin.tsx
import { MinimalLayout } from '@/components/layouts';

const SignInPage = () => {
  return <SignInForm />;
};

SignInPage.getLayout = function getLayout(page) {
  return <MinimalLayout>{page}</MinimalLayout>;
};

export default SignInPage;
```

**Changes:**

- ✅ Added `getLayout` function with `MinimalLayout`
- ✅ Removed wrapper divs and layout components
- ✅ Component now just renders the form

---

### Example 3: Page Already Using Custom Layout

**Before:**

```typescript
// pages/custom.tsx
const CustomPage = () => {
  return (
    <CustomWrapper>
      <CustomHeader />
      <div>Content</div>
      <CustomFooter />
    </CustomWrapper>
  );
};

export default CustomPage;
```

**After (Option A - Keep custom layout):**

```typescript
// pages/custom.tsx
const CustomPage = () => {
  return <div>Content</div>;
};

CustomPage.getLayout = function getLayout(page) {
  return (
    <CustomWrapper>
      <CustomHeader />
      {page}
      <CustomFooter />
    </CustomWrapper>
  );
};

export default CustomPage;
```

**After (Option B - Use standard layout):**

```typescript
// pages/custom.tsx
import { DefaultLayout } from '@/components/layouts';

const CustomPage = () => {
  return <div>Content</div>;
};

CustomPage.getLayout = function getLayout(page) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default CustomPage;
```

---

### Example 4: Class Component

**Before:**

```typescript
// pages/old-page.js
class OldPage extends React.Component {
  render() {
    return (
      <div>
        <Header />
        <Body>
          <div>Content</div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default OldPage;
```

**After:**

```typescript
// pages/old-page.js
import { DefaultLayout } from '@/components/layouts';

class OldPage extends React.Component {
  render() {
    return <div>Content</div>;
  }
}

// Add getLayout as a static property
OldPage.getLayout = function getLayout(page) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default OldPage;
```

## Common Pitfalls

### ❌ Don't nest layout definitions

```typescript
// BAD
const Page = () => {
  Page.getLayout = (page) => <Layout>{page}</Layout>;
  return <div>Content</div>;
};
```

```typescript
// GOOD
const Page = () => <div>Content</div>;
Page.getLayout = (page) => <Layout>{page}</Layout>;
```

### ❌ Don't duplicate layout code

```typescript
// BAD
const Page = () => {
  return (
    <div>
      <Header />
      <div>Content</div>
      <Footer />
    </div>
  );
};
Page.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>;
```

```typescript
// GOOD
const Page = () => <div>Content</div>;
Page.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>;
```

### ❌ Don't forget to test

Always test after migration:

- Visual appearance
- Navigation
- Responsive behavior
- Page transitions
- Authentication flows

## Migration Checklist

Use this checklist for each page you migrate:

- [ ] Identified correct layout type
- [ ] Added `getLayout` function
- [ ] Removed old layout code from component
- [ ] Added appropriate imports
- [ ] Tested page rendering
- [ ] Tested navigation to/from page
- [ ] Tested on mobile
- [ ] Tested authentication (if applicable)
- [ ] Checked for console errors
- [ ] Checked for linter warnings

## TypeScript Migration

For TypeScript pages, add the type annotation:

```typescript
import type { NextPageWithLayout } from '@/lib/types';

const Page: NextPageWithLayout = () => {
  return <div>Content</div>;
};

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>{page}</Layout>;
};
```

## Batch Migration Strategy

For migrating multiple pages:

1. **Phase 1**: Auth pages (signin, signup, reset-password)
2. **Phase 2**: Dashboard pages
3. **Phase 3**: Marketing/content pages
4. **Phase 4**: Special pages (embeds, etc.)

Within each phase:

1. Pick similar pages to migrate together
2. Create a branch for the migration
3. Migrate and test each page
4. Submit PR with grouped changes
5. Review and merge

## Testing Checklist

After migrating pages, verify:

- [ ] All pages render correctly
- [ ] Layout transitions are smooth
- [ ] No console errors or warnings
- [ ] No visual regressions
- [ ] Mobile responsive design works
- [ ] All navigation works
- [ ] Authentication flows work
- [ ] Page metadata is correct
- [ ] SEO elements are preserved

## Getting Help

If you encounter issues:

1. Check the examples in `examples/layout-patterns.tsx`
2. Review the documentation in `docs/layouts.md`
3. Look at existing migrated pages like `pages/dashboard.tsx`
4. Check the layout implementations in `components/layouts/`

## Questions?

Common questions and answers:

**Q: Can I use multiple layouts on the same page?**
A: No, each page can only have one layout. But you can create a custom layout that combines features.

**Q: What if I need dynamic layout based on user state?**
A: You can conditionally render different layouts in the `getLayout` function based on props or context.

**Q: Do I have to migrate all pages at once?**
A: No! The pattern is fully backward compatible. Migrate incrementally.

**Q: What about nested layouts?**
A: You can nest layouts by having one layout render another inside its `getLayout` function.

**Q: Can I use this with getServerSideProps?**
A: Yes! The pattern works seamlessly with all Next.js data fetching methods.
