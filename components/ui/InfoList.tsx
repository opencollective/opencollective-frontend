import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { FormattedMessage } from 'react-intl';

import { cn } from '../../lib/utils';

import { Skeleton } from './Skeleton';

// ui library

const infoListVariants = cva('grid grid-cols-1', {
  variants: {
    variant: {
      default: 'gap-y-4 [&_.info-list-item]:border-t [&_.info-list-item]:py-4 [&_dd]:mt-1',
      compact: 'gap-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type InfoListProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof infoListVariants>;

export function InfoList({ children, className, variant }: InfoListProps) {
  return <dl className={cn(infoListVariants({ variant }), className)}>{children}</dl>;
}

export function InfoListItemTitle({ children }: { children: React.ReactNode }) {
  return <dt className="leading-5 font-semibold text-slate-700">{children}</dt>;
}

// ts-unused-exports:disable-next-line
export function InfoListItemValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dd className={cn('mt-0.5 leading-6 text-slate-700', className)}>{children}</dd>;
}

export function InfoListItem({
  title,
  value,
  children,
  className,
  isLoading,
}: {
  title?: React.ReactNode;
  value?: React.ReactNode;
  children?: React.ReactNode;
  colSpan?: 1 | 2;
  className?: string;
  isLoading?: boolean;
}) {
  return (
    <div className={cn('info-list-item border-slate-100 text-sm', className)}>
      {title && <InfoListItemTitle>{title}</InfoListItemTitle>}
      {isLoading ? (
        <InfoListItemValue className="py-1">
          <Skeleton className="h-4 w-1/2" />
        </InfoListItemValue>
      ) : value ? (
        <InfoListItemValue>{value}</InfoListItemValue>
      ) : (
        <InfoListItemValue className="text-muted-foreground">
          <FormattedMessage defaultMessage="None" id="450Fty" />
        </InfoListItemValue>
      )}
      {children}
    </div>
  );
}
