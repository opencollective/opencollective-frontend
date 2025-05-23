import React from 'react';
import { CheckCircle, CircleX } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';

export const MatchBadge = ({ children, hasMatch }: { children: React.ReactNode; hasMatch: boolean | undefined }) => {
  if (hasMatch === undefined) {
    return <Badge size="xs">{children}</Badge>;
  } else {
    return (
      <Badge size="xs" type={hasMatch ? 'success' : 'error'}>
        <span className="text-slate-700">{children}</span>{' '}
        {hasMatch ? <CheckCircle size={16} className="ml-1 inline" /> : <CircleX size={16} className="ml-1 inline" />}
      </Badge>
    );
  }
};
