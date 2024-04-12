import React from 'react';

/**
 * A simple component to call `onChange` whenever `value` changes.
 * Useful when you want to trigger a function whenever a value changes outside of a functional component.
 */
export function OnChange<T>({
  children,
  value,
  onChange,
}: {
  children: React.ReactNode;
  value: T;
  onChange: (value: T) => void;
}) {
  React.useEffect(() => {
    onChange(value);
  }, [onChange, value]);

  return children;
}
