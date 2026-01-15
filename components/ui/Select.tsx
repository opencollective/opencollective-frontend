'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

import { elementFromClass } from '../../lib/react-utils';
import { cn } from '../../lib/utils';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './Command';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-hidden transition-[color,box-shadow] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-expanded:ring-2 aria-expanded:ring-ring',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectTriggerMini = elementFromClass(
  SelectTrigger,
  'flex w-fit h-fit text-sm px-0 py-0 text-nowrap rounded-xs items-center border-none justify-start gap-1 text-sm text-blue-600 ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
);

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-3000 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'max-h-[var(--radix-select-content-available-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn('py-1.5 pr-2 pl-8 text-sm font-semibold', className)} {...props} />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, asChild, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText asChild={asChild}>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

type DefaultCommandSelectProps = {
  name: string;
  placeholder: string;
  searchPlaceholder?: string;
  emptyResultLabel?: string | React.ReactNode;
  value: string;
  setValue: (value: string) => void;
  options: { value: string; label: string | React.ReactNode }[];
};

const DefaultCommandSelect = ({
  name,
  placeholder,
  searchPlaceholder,
  emptyResultLabel,
  value,
  setValue,
  options,
}: DefaultCommandSelectProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setOpen] = React.useState(false);
  const handleSelectOpen = React.useCallback(
    open => {
      setOpen(open);
      if (open) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    },
    [inputRef],
  );
  return (
    <Select value={value} open={isOpen} onOpenChange={handleSelectOpen}>
      <SelectTrigger className={cn(!value && 'text-muted-foreground')} data-cy={`${name}-trigger`}>
        {options.find(option => option.value === value)?.label || placeholder}
      </SelectTrigger>
      <SelectContent className="max-h-[50vh]">
        <Command>
          <CommandInput placeholder={searchPlaceholder} data-cy={`${name}-search`} ref={inputRef} />
          <CommandList data-cy={`${name}-list`}>
            <CommandEmpty>{emptyResultLabel}</CommandEmpty>
            <CommandGroup>
              {options.map(({ value, label }) => (
                <CommandItem
                  key={value}
                  data-cy={`${name}-${value}`}
                  onSelect={() => {
                    setValue(value);
                    setOpen(false);
                  }}
                >
                  <span>{label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </SelectContent>
    </Select>
  );
};

const DefaultSelect = ({ name, placeholder, value, setValue, options }: DefaultCommandSelectProps) => {
  return (
    <Select onValueChange={setValue} value={value} name={name}>
      <SelectTrigger data-cy={`${name}-trigger`} className="flex-1">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(({ value, label }) => (
          <SelectItem className="cursor-pointer" data-cy={`${name}-${value}`} value={value} key={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectTriggerMini,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  DefaultCommandSelect,
  DefaultSelect,
};
