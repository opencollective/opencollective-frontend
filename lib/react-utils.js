/**
 * Merge react refs.
 * Adapted from https://github.com/smooth-code/react-merge-refs
 */
export const mergeRefs = refs => {
  return value => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        ref.current = value;
      }
    });
  };
};
