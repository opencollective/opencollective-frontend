import React from 'react';
import { FormattedMessage } from 'react-intl';

import { cn } from '@/lib/utils';

import { DocumentationCard } from './DocumentationCard';
type DocumentationCardListProps = {
  docs: {
    title: React.ReactNode;
    excerpt: React.ReactNode;
    href: string;
  }[];
  className?: string;
};

export function DocumentationCardList(props: DocumentationCardListProps) {
  return (
    <div className={cn('space-y-2', props.className)}>
      <h4 className="text-xs font-medium tracking-wide text-slate-600 uppercase">
        <FormattedMessage id="menu.documentation" defaultMessage="Documentation" />
      </h4>
      {props.docs.map(doc => (
        <DocumentationCard key={doc.href} {...doc} />
      ))}
    </div>
  );
}
