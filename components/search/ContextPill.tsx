import React from 'react';
import { useQuery } from '@apollo/client';
import { X } from 'lucide-react';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Avatar from '../Avatar';

import { contextQuery } from './queries';

export const ContextPill = ({ slug, onRemove }) => {
  const { data } = useQuery(contextQuery, {
    variables: { slug },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-first',
  });
  return (
    <div className="flex max-w-fit shrink-0 items-center gap-2 overflow-hidden rounded-md bg-muted pr-1 select-none">
      <Avatar collective={data?.account} size={20} className="m-1 bg-white shadow-xs" />
      <div className="text-sm">{data?.account.name ?? slug}</div>
      {onRemove && (
        <button
          tabIndex={-1}
          onClick={onRemove}
          className="flex size-5 items-center justify-center rounded p-0.5 hover:bg-slate-200 focus:outline-hidden focus-visible:bg-slate-200"
        >
          <X size={16} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
