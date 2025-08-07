'use client';

import React, { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

import { cn } from '@/lib/utils';
import type { StaticImport } from 'next/dist/shared/lib/get-img-props';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/motion-primitives/Accordion';

export type TFeatureSection = {
  title: string;
  description?: string;
  tailwindColor?: string;
  fgColor?: string;
  bgColor?: string;
  items: {
    title: string;
    description: string;
    media?: {
      src: string | StaticImport;
      srcWidth: number;
      srcHeight: number;
      alt?: string;
      containerClasses?: string;
      mediaClasses?: string;
      containerStyle?: React.CSSProperties;
      style?: React.CSSProperties;
    };
  }[];
};

export default function FeatureSection({
  section,
  sectionIndex,
  onItemSelect,
  isActive,
  onBecomeVisible,
}: {
  section: TFeatureSection;
  sectionIndex: number;
  onItemSelect: (itemIndex: number) => void;
  isActive: boolean;
  onBecomeVisible: (index: number) => void;
}) {
  const [openItem, setOpenItem] = React.useState<React.Key | null>(section.items[0].title);
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
  const handleValueChange = (key: React.Key | null) => {
    if (key) {
      setOpenItem(key);

      // Find the index of the opened item
      const itemIndex = section.items.findIndex(item => item.title === key);
      if (itemIndex !== -1) {
        onItemSelect(itemIndex);
      }
    }
  };

  // Create a style object to locally set the --primary variable if provided
  // const sectionStyle = section.tailwindColor
  //   ? ({
  //       "--primary": `var(--color-${section.tailwindColor})`,
  //     } as React.CSSProperties)
  //   : undefined;

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
        <Accordion
          className="flex w-full flex-col"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          expandedValue={openItem}
          onValueChange={handleValueChange}
        >
          {section.items.map(feature => {
            return (
              <AccordionItem key={feature.title} value={feature.title} className="py-2">
                <AccordionTrigger
                  className={cn(
                    'w-full cursor-pointer border-b py-2 text-left text-xl',
                    openItem === feature.title ? 'cursor-default' : 'cursor-pointer',
                  )}
                >
                  <div className="flex items-center justify-between text-slate-600 transition-colors group-hover:text-foreground group-data-expanded:text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="size-2 shrink-0 bg-gray-400 transition-colors group-hover:bg-primary group-data-expanded:bg-primary" />
                      <div>{feature.title}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="pt-4 pb-6 text-base text-muted-foreground">{feature.description}</p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
