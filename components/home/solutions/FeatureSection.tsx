import React, { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { FormattedMessage } from 'react-intl';

import { cn } from '@/lib/utils';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';

import type { IFeatureSection } from './Features';

export default function FeatureSection({
  section,
  sectionIndex,
  onItemSelect,
  isActive,
  onBecomeVisible,
}: {
  section: IFeatureSection;
  sectionIndex: number;
  onItemSelect: (itemIndex: number) => void;
  isActive: boolean;
  onBecomeVisible: (index: number) => void;
}) {
  const [openItem, setOpenItem] = React.useState<string>(section.items[0].title.id);
  const sectionRef = useRef<HTMLDivElement>(null);

  const inView = useInView(sectionRef, {
    amount: 0.1,
    once: false,
    margin: '-10% 0px -40% 0px',
  });

  useEffect(() => {
    if (inView) {
      onBecomeVisible(sectionIndex);
    }
  }, [inView, sectionIndex, onBecomeVisible]);

  const handleValueChange = (value: string) => {
    setOpenItem(value);

    const itemIndex = section.items.findIndex(item => item.title.id === value);
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
        key={section.title.id}
        ref={sectionRef}
        style={sectionStyle}
        className={cn(
          'flex flex-col items-start justify-start transition-opacity',
          isActive ? 'opacity-100' : 'opacity-50',
        )}
      >
        <h3 className="mb-4 text-4xl font-semibold tracking-tight">
          <FormattedMessage {...section.title} />
        </h3>
        {section.description && (
          <p className="mb-4 text-muted-foreground">
            <FormattedMessage {...section.description} />
          </p>
        )}
        <Accordion type="single" value={openItem} onValueChange={handleValueChange} className="flex w-full flex-col">
          {section.items.map(feature => {
            return (
              <AccordionItem key={feature.title.id} value={feature.title.id} className="border-0 py-2">
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
                      <div>
                        <FormattedMessage {...feature.title} />
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0">
                  <p className="pt-4 pb-4 text-base text-muted-foreground">
                    <FormattedMessage {...feature.description} />
                  </p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
