import React from 'react';
import { Settings } from 'lucide-react';

import { cn } from '../../../../lib/utils';

import { Button } from '../../../ui/Button';
import { DropdownMenu, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';

export const CSVColumnSelector = ({ label, selected, columns, onChange, SettingsDropdownMenuContent = null }) => {
  return (
    <div className="flex items-stretch">
      <div className="relative flex items-center rounded-bl-md rounded-tl-md border border-r-0 border-neutral-200 bg-neutral-100 px-3 text-sm font-medium text-neutral-700">
        {label}
      </div>
      <Select onValueChange={onChange} value={selected}>
        <SelectTrigger className={cn('rounded-none', { 'rounded-br-md rounded-tr-md': !SettingsDropdownMenuContent })}>
          <div className="truncate italic text-neutral-800">
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
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
              className="rounded-bl-none rounded-tl-none border-l-0 px-2"
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
