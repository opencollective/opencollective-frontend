import React from 'react';
import { isObject } from 'lodash';

import { cn } from '../../lib/utils';

export function DataList({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <dl className={cn('flex w-full flex-col gap-3', className)}>{children}</dl>;
}

export function DataListItemValue({
  children,
  className,
  showValueAsTitle,
}: {
  children?: React.ReactNode;
  className?: string;
  showValueAsTitle?: boolean;
}) {
  return (
    <div className={cn('max-w-fit break-words', className)} title={showValueAsTitle ? String(children) : undefined}>
      {children}
    </div>
  );
}

export function DataListItemLabel({
  children,
  className,
  title,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn('max-w-[240px] min-w-[180px] shrink-0 grow-0 basis-1/4 text-muted-foreground', className)}
      title={title}
    >
      {children}
    </div>
  );
}

export type DataListItemProps = {
  label?: React.ReactNode;
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  labelClassName?: string;
  showValueAsItemTitle?: boolean;
};

export function DataListItem({
  children,
  label,
  value,
  className,
  itemClassName,
  labelClassName,
  showValueAsItemTitle,
}: DataListItemProps) {
  return (
    <div className={cn('relative flex w-full flex-col gap-3 sm:flex-row', className)}>
      {label && <DataListItemLabel className={labelClassName}>{label}</DataListItemLabel>}
      {value && (
        <DataListItemValue className={itemClassName} showValueAsTitle={showValueAsItemTitle}>
          {value}
        </DataListItemValue>
      )}
      {children}
    </div>
  );
}

/**
 * A component to recursively render multiple rows if `value` is an object.
 */
export function NestedObjectDataListItem({
  children,
  label,
  value,
  className,
  itemClassName,
  labelClassName,
  showValueAsItemTitle,
}: Omit<DataListItemProps, 'value'> & {
  value: object | React.ReactNode; // Intended any: the component is meant to recursively display any kind of value
}) {
  if (isObject(value) && value !== null) {
    return (
      <div className={className}>
        {label && <DataListItemLabel className={labelClassName}>{label}:</DataListItemLabel>}
        <div className="flex flex-col gap-1 pt-1">
          {Object.entries(value).map(([key, val]) => {
            return (
              <NestedObjectDataListItem
                key={key}
                label={`- ${key}`}
                value={val}
                className={cn('pl-2')}
                itemClassName={itemClassName}
                labelClassName={cn(labelClassName, 'truncate')}
                showValueAsItemTitle={showValueAsItemTitle}
              />
            );
          })}
          {children}
        </div>
      </div>
    );
  }

  return (
    <DataListItem
      label={label}
      value={value as React.ReactNode}
      className={className}
      itemClassName={itemClassName}
      labelClassName={labelClassName}
      showValueAsItemTitle={showValueAsItemTitle}
    >
      {children}
    </DataListItem>
  );
}
