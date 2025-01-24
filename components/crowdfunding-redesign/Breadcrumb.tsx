import React from 'react';
import { Slash } from 'lucide-react';

import Link from '../Link';

export function Breadcrumb({ breadcrumbs }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Slash size={20} strokeWidth={1} />

      {breadcrumbs?.map(({ href, label }, i, a) => {
        if (i === a.length - 1) {
          return (
            <span key={href} className="p-1 text-foreground">
              {label}
            </span>
          );
        }
        return (
          <React.Fragment key={href}>
            <Link href={href} className="rounded p-1 hover:bg-muted hover:text-foreground">
              <span className="text-muted-foreground">{label}</span>
            </Link>
            <Slash size={20} strokeWidth={1} />
          </React.Fragment>
        );
      })}
    </div>
  );
}
