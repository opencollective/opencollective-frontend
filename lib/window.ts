/**
 * A helper that returns `window.location` if it exists.
 * Two advantages:
 * 1. It makes it easier to mock `window.location` in tests.
 * 2. It doesn't crash the server-side rendering.
 */
export const getWindowLocation = (): Location | undefined => {
  if (typeof window !== 'undefined') {
    return window.location;
  }
};
