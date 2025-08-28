'use client';

import React, { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

import { cn } from '@/lib/utils';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';

import type { FeatureSection } from './features-data';

export default function FeatureSection({
  section,
  sectionIndex,
  onItemSelect,
  isActive,
  onBecomeVisible,
}: {
  section: FeatureSection;
  sectionIndex: number;
  onItemSelect: (itemIndex: number) => void;
  isActive: boolean;
  onBecomeVisible: (index: number) => void;
}) {
  const [openItem, setOpenItem] = React.useState<string>(section.items[0].title);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Use Framer Motion's useInView hook instead of manual IntersectionObserver
  const inView = useInView(sectionRef, {
    // Amount of element that needs to be visible (0-1)
    amount: 0.1,
    // Only trigger once? Set to false to keep checking visibility
    once: false,
    // Margin around the root similar to IntersectionObserver rootMargin
    margin: '-10% 0px -40% 0px',
  });

  // When this section comes into view, notify the parent
  useEffect(() => {
    if (inView) {
      onBecomeVisible(sectionIndex);
    }
  }, [inView, sectionIndex, onBecomeVisible]);

  // When an item is opened, update the parent component
  const handleValueChange = (value: string) => {
    setOpenItem(value);

    // Find the index of the opened item
    const itemIndex = section.items.findIndex(item => item.title === value);
    if (itemIndex !== -1) {
      onItemSelect(itemIndex);
    }
  };

  const sectionStyle = {
    ...(section.fgColor && {
      '--primary': `var(--color-${section.fgColor})`,
    }),
    ...(section.bgColor && {
      '--card': `var(--color-${section.bgColor})`,
    }),
  } as React.CSSProperties;

  return (
    <div className="pb-[30dvh] last:pb-12">
      <div
        key={section.title}
        ref={sectionRef}
        style={sectionStyle}
        className={cn(
          'flex flex-col items-start justify-start transition-opacity',
          isActive ? 'opacity-100' : 'opacity-50',
        )}
      >
        <h3 className="mb-4 text-4xl font-semibold tracking-tight">{section.title}</h3>
        {section.description && <p className="mb-4 text-muted-foreground">{section.description}</p>}
        <Accordion type="single" value={openItem} onValueChange={handleValueChange} className="flex w-full flex-col">
          {section.items.map(feature => {
            return (
              <AccordionItem key={feature.title} value={feature.title} className="border-0 py-2">
                <AccordionTrigger
                  className={cn(
                    'font-r w-full border-b py-2 text-left text-xl font-normal hover:no-underline',
                    '[&[data-state=open]>div]:text-foreground',
                    '[&[data-state=open]>div>div>div:first-child]:bg-primary',
                    '[&>svg]:hidden', // Hide the default chevron
                  )}
                >
                  <div className="flex items-center justify-between text-slate-600 transition-colors hover:text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="size-2 shrink-0 bg-gray-400 transition-colors" />
                      <div>{feature.title}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0">
                  <p className="pt-4 pb-4 text-base text-muted-foreground">{feature.description}</p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
