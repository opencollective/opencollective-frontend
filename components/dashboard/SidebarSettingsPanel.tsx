'use client';

import * as React from 'react';
import { ChevronDown, Settings as SettingsIcon } from 'lucide-react';

import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';

export enum SidebarOption {
  DEFAULT = 'DEFAULT',
  GROUPING = 'GROUPING',
}

// Pitched Solutions
// 1. Integrated “Contributions” tool
//   1. Merge “Contributions → To Collectives” and “Contributions → To Host name” into a unified “Incoming contributions” tool with the all/org/hosted filter UX.
// 2. Establish “Money In”
//   1. Move “Contributions → From Host Name” out of the contributions and into the “Expenses” group and rename it “Outgoing Contributions.”
//   2. Rename the “Contributions” group to “Incoming Money.”
//   3. Split “Expected Funds” into two separate tools that both live under “Incoming Money”
//     1. “Incomplete Contributions” for contributions that were initiated as bank transfer but have not been reconciled..
//     2. “Issued Payment Requests” to represent what we’ve come to think of as intentionally created  “Expected Funds.”
// 3. Integrated “Received Money” tool
//   1. Create a new “Received Money” tool for reviewing, filtering and searching all money that has been received and documented on the ledger.
// 4. Sowing the seeds for “Money Out” by creating a “Paid Disbursements” tool.
//   1. Create a new “Disbursed Money” tool for reviewing, filtering and search all money that has been paid out and documented on the ledger.
//   2. Rename “Expenses → To Collectives” into “Pay Disbursements”, add the “all/org/hosted” filter to it and remove from it the last “paid” pipeline tab.
// 5. Introduction of “Payment Requests” terminology
//   1. Rename and transform “Expenses → To Open Source Collective” into “Approve Payment Requests.”
//   2. Add an “Unpaid Payment Requests” tool that gives hosts access to all unpaid payment requests including those that have not yet been approved, approved but not yet paid and rejected.
// 6. Establish “Money Out”
//   1. Integrate the functionality of “Expenses → from Host Name” into the “Incoming Money → Expected Payments” tool (and remove it from the “Expenses Group”
//   2. Rename the “Expenses” group into “Outgoing Money”
// 7. Introduce “Internal Transfers” - these are payment intents that are neither incoming nor outgoing and includes transfers between
//   1. Within organization accounts
//   2. Organization to collectives accounts
//   3. Collective to organization accounts
//   4. Within collective accounts
//   5. Between collectives

const pitchedSolutions = [
  '1. Integrated "Contributions" tool',
  '2. Establish "Money In"',
  '3. Integrated "Received Money" tool',
  '4. Sowing the seeds for "Money Out" by creating a "Paid Disbursements" tool.',
  '5. Introduction of "Payment Requests" terminology',
  '6. Establish "Money Out"',
  '7. Introduce "Internal Transfers"',
];

export type DashboardSettings = {
  useLayoutReorg: boolean;
  sidebarOption: SidebarOption;
  pitchedSolutionsProgress: number;
};

export type DashboardSettingKey = keyof DashboardSettings;

export const DASHBOARD_SETTINGS_STORAGE_KEY = 'oc-dashboard-settings';

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  useLayoutReorg: false,
  sidebarOption: SidebarOption.DEFAULT,
  pitchedSolutionsProgress: 0,
};

type SidebarSettingsPanelProps = {
  settings: DashboardSettings | undefined;
  onSettingChange: <K extends DashboardSettingKey>(key: K, value: DashboardSettings[K]) => void;
};

export function SidebarSettingsPanel({ settings, onSettingChange }: SidebarSettingsPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { LoggedInUser } = useLoggedInUser();
  const hasSidebarReorgPreviewFeature = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG);

  const resolvedSettings = hasSidebarReorgPreviewFeature
    ? (settings ?? DEFAULT_DASHBOARD_SETTINGS)
    : DEFAULT_DASHBOARD_SETTINGS;

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
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="pitched-solution-select">Pitched solution focus</Label>
                  {/* <p className="text-xs text-muted-foreground">
                    Choose which pitched solution you are concentrating on right now.
                  </p> */}
                </div>
                <Select
                  value={resolvedSettings.pitchedSolutionsProgress.toString()}
                  onValueChange={value => onSettingChange('pitchedSolutionsProgress', Number(value))}
                >
                  <SelectTrigger id="pitched-solution-select">
                    <SelectValue placeholder="Select a pitched solution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Default</SelectItem>
                    {pitchedSolutions.map((solution, index) => (
                      <SelectItem key={solution} value={(index + 1).toString()}>
                        {solution}
                      </SelectItem>
                    ))}
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
