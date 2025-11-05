# Storybook Error Improvements

This document summarizes the improvements made to Storybook error handling and visibility.

## Problems Addressed

1. **Vite Cache Issues (504 "Outdated Optimize Dep")**
   - These errors occurred when Vite's dependency cache became stale
   - Caused by changes to dependencies or configuration

2. **React DOM Warnings**
   - styled-components props like `lineHeight`, `alignItems`, `maxHeight`, `minWidth`, `maxWidth` were being passed to DOM elements
   - React warned because these aren't valid HTML attributes

3. **styled-components Warnings**
   - Custom props like `variant`, `m`, `maxHeight` were being sent through to the DOM
   - styled-components recommended using prop filtering

## Solutions Implemented

### 1. Vite Cache Clearing

**Cleared the cache:**

```bash
rm -rf node_modules/.cache/storybook
```

**Added npm script for easy cache clearing:**

```bash
npm run storybook:clean
```

This script can be run anytime you encounter "Outdated Optimize Dep" errors.

### 2. styled-components Prop Filtering

**Added `StyleSheetManager` with `shouldForwardProp`** in `.storybook/preview.ts`:

```typescript
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
```

This configuration:

- Uses `@emotion/is-prop-valid` to filter out style props for HTML elements
- Prevents styled-system props (like `m`, `p`, `bg`, etc.) from reaching the DOM
- Allows all props to pass through to custom React components
- Eliminates React warnings about invalid DOM props

### 3. Enhanced Error Visibility

**Updated `.storybook/main.ts`** with better error handling:

```typescript
viteFinal: async config => {
  // Show error overlay on HMR errors
  if (config.server) {
    config.server.hmr = {
      overlay: true,
    };
  }

  // Better source maps for debugging
  config.build = config.build || {};
  config.build.sourcemap = true;

  // Optimize dependency handling
  config.optimizeDeps = config.optimizeDeps || {};
  config.optimizeDeps.include = [
    ...(config.optimizeDeps.include || []),
    'react',
    'react-dom',
    'react-intl',
    'styled-components',
    '@emotion/is-prop-valid',
  ];

  return config;
};
```

This configuration:

- Enables the error overlay for Hot Module Replacement (HMR) errors
- Generates source maps for better debugging
- Pre-optimizes critical dependencies to avoid cache issues

## Usage

### Clear Storybook Cache

If you see "Outdated Optimize Dep" or similar cache-related errors:

```bash
npm run storybook:clean
```

Then restart Storybook:

```bash
npm run storybook
```

### Viewing Errors

With these improvements:

- **Error Overlay**: Errors now appear in a full-screen overlay with stack traces
- **Console Warnings**: Reduced noise from invalid prop warnings
- **Source Maps**: Click on errors in the console to see the actual source code

## Benefits

1. **Clearer Error Messages**: Errors are now displayed prominently in an overlay
2. **Reduced Console Noise**: No more warnings about invalid DOM props
3. **Better Debugging**: Source maps make it easier to trace errors to their source
4. **Easier Maintenance**: Simple script to clear cache when needed
5. **Better Performance**: Pre-optimized dependencies load faster

## Future Improvements

Consider these additional enhancements:

1. **Error Boundaries**: Add custom error boundaries to stories for better error isolation
2. **Custom Logger**: Implement a custom logger to format errors more clearly
3. **Error Categorization**: Group errors by type (network, React, build, etc.)
4. **Automated Cache Clearing**: Set up a pre-storybook script to clear cache if it's stale

## Related Files

- `.storybook/main.ts` - Main Storybook configuration
- `.storybook/preview.ts` - Preview configuration with decorators
- `package.json` - Added `storybook:clean` script
