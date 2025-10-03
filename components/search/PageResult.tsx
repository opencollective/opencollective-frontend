import React from 'react';
import type { LucideIcon } from 'lucide-react';

export function PageResult({
  page,
}: {
  page: { group?: string; page?: string; label?: string; Icon?: LucideIcon; iconDisplayName?: string };
}) {
  return (
    <div className="flex items-center gap-2">
      {page.Icon && <page.Icon className="text-muted-foreground" size={20} />}
      <div>
        {page.group && <span className="text-muted-foreground">{page.group} &gt; </span>}
        {page.label}
      </div>
    </div>
  );
}
