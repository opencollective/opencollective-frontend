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

/**
 * Create a Tailwind React element from an HTML tag and a Tailwind CSS class.
 * @example elementFromClass('div', 'text-md font-bold text-slate-800 mb-2 flex gap-4 items-center')
 */
export function elementFromClass<K extends keyof React.JSX.IntrinsicElements>(
  type: K,
  className: string,
): React.ForwardRefExoticComponent<React.JSX.IntrinsicElements[K]>;

export function elementFromClass<T>(type: T, className: string): T;

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
