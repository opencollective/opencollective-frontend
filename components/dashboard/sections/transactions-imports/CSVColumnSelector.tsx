import React from 'react';
import { Settings } from 'lucide-react';

import { cn } from '../../../../lib/utils';

import { Button } from '../../../ui/Button';
import { DropdownMenu, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';

export const CSVColumnSelector = ({ label, selected, columns, onChange, SettingsDropdownMenuContent = null }) => {
  return (
    <div className="flex items-stretch">
      <div className="relative flex items-center rounded-tl-md rounded-bl-md border border-r-0 border-neutral-200 bg-neutral-100 px-3 text-sm font-medium text-neutral-700">
        {label}
      </div>
      <Select onValueChange={onChange} value={selected}>
        <SelectTrigger className={cn('rounded-none', { 'rounded-tr-md rounded-br-md': !SettingsDropdownMenuContent })}>
          <div className="truncate text-neutral-800 italic">
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {columns.map(column => (
            <SelectItem value={column} key={column}>
              {column}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {SettingsDropdownMenuContent && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="rounded-tl-none rounded-bl-none border-l-0 px-2"
              aria-label="Configure"
            >
              <Settings size={16} color="#777" />
            </Button>
          </DropdownMenuTrigger>
          <SettingsDropdownMenuContent />
        </DropdownMenu>
      )}
    </div>
  );
};
