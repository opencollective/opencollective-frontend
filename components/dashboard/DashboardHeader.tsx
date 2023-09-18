import React from 'react';
import { LucideIcon, MoreHorizontal } from 'lucide-react';

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
  staticActions?: { label: string; Icon?: LucideIcon; primary?: boolean; onClick: () => void; disabled?: boolean }[];
  description?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold leading-10 tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">
          {primaryAction && (
            <Button disabled={primaryAction.disabled} size="lg" rounded onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {staticActions?.length > 0 &&
            staticActions.map(({ label, Icon, onClick, disabled, primary }) => (
              <Button
                key={label}
                size="lg"
                disabled={disabled}
                rounded
                onClick={onClick}
                variant={primary ? 'default' : 'outline'}
              >
                {Icon && <Icon size={16} />} {label}
              </Button>
            ))}
          {secondaryActions?.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg-icon" variant="outline" rounded>
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
