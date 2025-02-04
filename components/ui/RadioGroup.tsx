'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';

import { cn } from '../../lib/utils';

import { Collapsible, CollapsibleContent } from './Collapsible';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      id={props.id || props.value}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

const RadioGroupCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    showSubcontent?: boolean;
    subContent?: React.ReactNode;
  }
>(({ className, children, showSubcontent, subContent, ...props }, ref) => {
  return (
    <div
      className={`rounded-lg bg-card text-sm text-card-foreground ring-1 shadow-xs ring-border has-data-[state=checked]:ring-2 has-data-[state=checked]:ring-ring [&:has([role="radio"]:focus-visible)]:bg-primary/5`}
    >
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn('group w-full p-4 text-left outline-hidden', className)}
        asChild={false}
        {...props}
      >
        <div className="flex w-full items-center gap-4">
          <div className="flex aspect-square h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary text-primary ring-offset-background focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <RadioGroupPrimitive.Indicator>
              <Circle className="h-2.5 w-2.5 fill-current text-current" />
            </RadioGroupPrimitive.Indicator>
          </div>

          {children}
        </div>
      </RadioGroupPrimitive.Item>
      {subContent && (
        <Collapsible open={showSubcontent}>
          <CollapsibleContent className="p-4 pt-0">{subContent}</CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
});

RadioGroupCard.displayName = 'RadioGroupCards.Item';

export { RadioGroup, RadioGroupItem, RadioGroupCard };
