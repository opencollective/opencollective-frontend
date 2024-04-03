import React from 'react';

import { cn } from './utils';

/**
 * Merge react refs.
 * Adapted from https://github.com/smooth-code/react-merge-refs
 */
export const mergeRefs = refs => {
  return value => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref) {
        ref.current = value;
      }
    });
  };
};

export function elementFromClass<K extends keyof React.JSX.IntrinsicElements>(
  type: K,
  className: string,
): React.ForwardRefExoticComponent<React.JSX.IntrinsicElements[K]>;
// eslint-disable-next-line no-redeclare
export function elementFromClass<T>(type: T, className: string): T;
// eslint-disable-next-line no-redeclare
export function elementFromClass(type, className) {
  const render = (
    {
      children,
      className: propsClassName,
      ...props
    }: Parameters<typeof React.createElement>[1] & { children: React.ReactNode; className?: string },
    ref,
  ) => {
    children = Array.isArray(children) ? children : [children];
    return React.createElement(
      type,
      { ...props, className: cn(className, propsClassName), ref } as any,
      ...(children as any),
    );
  };
  render.displayName = typeof type === 'string' ? type : type.name;
  return React.forwardRef(render);
}
