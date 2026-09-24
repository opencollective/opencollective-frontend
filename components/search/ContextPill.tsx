import React from 'react';
import { useQuery } from '@apollo/client';
import { X } from 'lucide-react';

import Avatar from '../Avatar';

import { contextQuery } from './queries';

export const ContextPill = ({ slug, onRemove }: { slug: string; onRemove?: () => void }) => {
  const { data } = useQuery(contextQuery, {
    variables: { slug },

    fetchPolicy: 'cache-first',
  });
  return (
    <div className="flex max-w-fit shrink-0 items-center overflow-hidden rounded-md pr-1 ring ring-border select-none">
      <Avatar collective={data?.account} size={20} className="m-1 mr-2 bg-white shadow-xs" />
      <div className="text-sm">{data?.account.name ?? slug}</div>
      {onRemove && (
        <button
          tabIndex={-1}
          onClick={onRemove}
          className="ml-0.5 flex size-5 items-center justify-center rounded p-0.5 hover:bg-slate-200 focus:outline-hidden focus-visible:bg-slate-200"
        >
          <X size={16} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
