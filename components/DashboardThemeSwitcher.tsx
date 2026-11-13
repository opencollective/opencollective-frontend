import React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { defineMessages, useIntl } from 'react-intl';

import type { ThemePreference } from '../lib/hooks/useDashboardTheme';
import { useDashboardTheme } from '../lib/hooks/useDashboardTheme';
import { cn } from '../lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

const messages = defineMessages({
  theme: { id: 'Theme', defaultMessage: 'Theme' },
  system: { id: 'Theme.Auto', defaultMessage: 'Auto' },
  light: { id: 'Theme.Light', defaultMessage: 'Light' },
  dark: { id: 'Theme.Dark', defaultMessage: 'Dark' },
});

const OPTIONS: { value: ThemePreference; Icon: LucideIcon }[] = [
  { value: 'system', Icon: Monitor },
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
];

/**
 * A segmented control to pick the dashboard theme (Auto/Light/Dark).
 * Renders nothing if the dark mode preview feature is not enabled.
 */
export const DashboardThemeSwitcher = ({
  showLabels = false,
  className,
}: {
  /** Show text labels next to the icons. When false, labels are available as tooltips. */
  showLabels?: boolean;
  className?: string;
}) => {
  const intl = useIntl();
  const { isAvailable, preference, setPreference } = useDashboardTheme();
  if (!isAvailable) {
    return null;
  }

  return (
    <RadioGroupPrimitive.Root
      value={preference}
      onValueChange={value => setPreference(value as ThemePreference)}
      aria-label={intl.formatMessage(messages.theme)}
      orientation="horizontal"
      className={cn('inline-flex shrink-0 items-center gap-0.5 rounded-full bg-muted p-0.5', className)}
      data-cy="dashboard-theme-switcher"
    >
      {OPTIONS.map(({ value, Icon }) => {
        const label = intl.formatMessage(messages[value]);
        const item = (
          <RadioGroupPrimitive.Item
            key={value}
            value={value}
            aria-label={label}
            className={cn(
              'flex h-7 items-center justify-center gap-1.5 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-xs data-[state=checked]:ring-1 data-[state=checked]:ring-border',
              showLabels ? 'px-3 text-sm' : 'w-7',
            )}
          >
            <Icon size={14} aria-hidden />
            {showLabels && <span>{label}</span>}
          </RadioGroupPrimitive.Item>
        );

        return showLabels ? (
          item
        ) : (
          <Tooltip key={value} delayDuration={300}>
            <TooltipTrigger asChild>{item}</TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
};

/**
 * A "Theme" row for menus, with the switcher aligned to the right.
 */
export const DashboardThemeMenuRow = ({ className }: { className?: string }) => {
  const intl = useIntl();
  const { isAvailable } = useDashboardTheme();
  if (!isAvailable) {
    return null;
  }

  return (
    <div className={cn('mx-2 flex h-9 items-center justify-between gap-2 px-2 text-sm', className)}>
      <span>{intl.formatMessage(messages.theme)}</span>
      <DashboardThemeSwitcher />
    </div>
  );
};
