import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItems, DropdownMenuItem } from './ui/dropdown';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import { cx } from 'class-variance-authority';
export default function DashboardHeader({ title, primaryAction, secondaryActions }) {
  const buttonStyle =
    'text-sm px-2.5 py-1.5 bg-white rounded-md  flex items-center flex-nowrap gap-1 text-gray-900 font-medium ring-1 ring-inset ring-gray-300 hover:shadow transition-all shadow-sm';
  const secondaryButtonStyle =
    'text-sm px-2.5 py-1.5 bg-white rounded-md  flex items-center flex-nowrap gap-1 text-gray-900 font-medium ring-1 ring-inset ring-gray-300 hover:shadow transition-all shadow-sm';
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
      <div className="flex items-center gap-2">
        {primaryAction && (
          <button onClick={primaryAction.onClick} className={buttonStyle}>
            {primaryAction.label}
          </button>
        )}
        {secondaryActions && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button className={cx(buttonStyle)}>
                <span className="sr-only">Open menu</span>
                More <ChevronDown size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuItems align="right">
              {secondaryActions.map(action => (
                <DropdownMenuItem key={action.label} onClick={action.onClick}>
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuItems>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
