import React from 'react';

import { getCollectiveTypeForUrl } from '../lib/collective.lib';

import Link from './Link';

type LinkExpenseProps = {
  collective: {
    slug: string;
    type: string;
    parent?: {
      slug: string;
    };
  };
  expense: {
    id?: string | number;
    legacyId?: number;
  };
  onClick?: (expenseId: string | number) => void;
  children?: React.ReactNode;

  title?: string;
  openInNewTab?: boolean;
  className?: string;
};

const LinkExpense = ({ collective, expense, onClick, className, ...props }: LinkExpenseProps) => {
  const parentCollectiveSlugRoute = collective.parent?.slug
    ? `/${collective.parent.slug}/${getCollectiveTypeForUrl(collective)}`
    : '';
  const expenseId = expense.legacyId || expense.id;
  const href = `${parentCollectiveSlugRoute}/${collective.slug}/expenses/${expenseId}`;

  if (onClick) {
    props['onClick'] = e => {
      e.preventDefault();
      onClick(expenseId);
    };
  }
  return <Link href={href} className={className} {...props} />;
};

export default LinkExpense;
