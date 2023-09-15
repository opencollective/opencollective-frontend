import React from 'react';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';

export default function DashboardHeader({
  title,
  staticActions,
  primaryAction,
  secondaryActions,
  description,
}: {
  title: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryActions?: { label: string; onClick: () => void; disabled?: boolean }[];
  description?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold leading-10 tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">
          {primaryAction && (
            <Button disabled={primaryAction.disabled} size="sm" type="primary" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {staticActions?.length > 0 &&
            staticActions.map(({ label, onClick, disabled }) => (
              <Button key={label} disabled={disabled} size="sm" onClick={onClick} variant="outline">
                {label}
              </Button>
            ))}
          {secondaryActions?.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm-icon">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {secondaryActions.map(({ label, onClick, disabled }) => (
                  <DropdownMenuItem key={label} onClick={onClick} disabled={disabled}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {description && <p className="mb-4 max-w-prose text-muted-foreground">{description}</p>}
    </div>
  );
}
