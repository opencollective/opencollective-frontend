'use client';

import * as React from 'react';
import { ChevronDown, Settings as SettingsIcon } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

export enum SidebarOption {
  DEFAULT = 'DEFAULT',
  GROUPING = 'GROUPING',
}

export type DashboardSettings = {
  useLayoutReorg: boolean;
  sidebarOption: SidebarOption;
};

export type DashboardSettingKey = keyof DashboardSettings;

export const DASHBOARD_SETTINGS_STORAGE_KEY = 'oc-dashboard-settings';

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  useLayoutReorg: false,
  sidebarOption: SidebarOption.DEFAULT,
};

type SidebarSettingsPanelProps = {
  settings: DashboardSettings | undefined;
  onSettingChange: <K extends DashboardSettingKey>(key: K, value: DashboardSettings[K]) => void;
};

export function SidebarSettingsPanel({ settings, onSettingChange }: SidebarSettingsPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const resolvedSettings = settings ?? DEFAULT_DASHBOARD_SETTINGS;

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 max-w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="gap-0 border-border bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <SettingsIcon className="h-4 w-4" />
              </span>
              <CardTitle className="text-base">Prototype Settings</CardTitle>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 p-0"
                aria-label={isOpen ? 'Collapse settings' : 'Expand settings'}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="use-layout-reorg-toggle">Reorganized layout</Label>
                  {/* <p className="text-xs text-muted-foreground">
                    Toggle this to remember your sidebar reorganization preference.
                  </p> */}
                </div>
                <Switch
                  id="use-layout-reorg-toggle"
                  checked={resolvedSettings.useLayoutReorg}
                  onCheckedChange={checked => onSettingChange('useLayoutReorg', checked)}
                  aria-label="Use reorganized layout"
                />
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="sidebar-option-select">Sidebar content</Label>
                  {/* <p className="text-xs text-muted-foreground">
                    Pick the layout that helps you navigate host tools fastest.
                  </p> */}
                </div>
                <Select
                  value={resolvedSettings.sidebarOption}
                  onValueChange={value => onSettingChange('sidebarOption', value as SidebarOption)}
                >
                  <SelectTrigger id="sidebar-option-select">
                    <SelectValue placeholder="Select a sidebar menu style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SidebarOption.DEFAULT}>Default</SelectItem>
                    <SelectItem value={SidebarOption.GROUPING}>Grouped host tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
