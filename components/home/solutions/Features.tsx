import React, { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useIntl } from 'react-intl';

import { cn } from '@/lib/utils';
import type { StaticImport } from 'next/dist/shared/lib/get-img-props';

import Image from '@/components/Image';

import FeatureSection from './FeatureSection';

export interface IFeatureSection {
  title: { id: string; defaultMessage: string };
  description?: { id: string; defaultMessage: string };
  tailwindColor?: string;
  fgColor?: string;
  bgColor?: string;
  items: {
    title: { id: string; defaultMessage: string };
    description: { id: string; defaultMessage: string };
    media?: {
      src: string | StaticImport;
      srcWidth: number;
      srcHeight: number;
      style?: CSSProperties;
      containerStyle?: CSSProperties;
      containerClasses?: string;
      mediaClasses?: string;
    };
  }[];
}

export default function Features({ featureSections }: { featureSections: IFeatureSection[] }) {
  const intl = useIntl();
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track active sub-items for each section
  const [activeSectionItems, setActiveSectionItems] = useState<number[]>(featureSections.map(() => 0));

  // Handle section becoming visible
  const handleSectionVisible = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Handle sub-item selection
  const handleItemSelect = (sectionIndex: number, itemIndex: number) => {
    setActiveSectionItems(prev => {
      const newActiveSectionItems = [...prev];
      newActiveSectionItems[sectionIndex] = itemIndex;
      return newActiveSectionItems;
    });
  };

  return (
    <section className="relative flex flex-col px-6 pb-24 lg:flex-row lg:gap-18" ref={containerRef}>
      {/* Mobile Layout: Sections with integrated visuals */}
      <div className="lg:hidden">
        {featureSections.map((section, sectionIndex) => (
          <div key={section.title.id} className="mb-16">
            {/* Mobile visual for current section - always visible */}
            <div className="relative mb-8">
              {section.items.map((item, itemIndex) => {
                const img = item.media || section.items[0]?.media;
                const isActive = activeSectionItems[sectionIndex] === itemIndex;

                const sectionStyle = {
                  ...(section.fgColor && {
                    '--primary': `var(--color-${section.fgColor})`,
                  }),
                  ...(section.bgColor && {
                    '--card': `var(--color-${section.bgColor})`,
                  }),
                } as React.CSSProperties;

                return (
                  <div
                    key={`${section.title.id}-${item.title.id}`}
                    className={cn(
                      'absolute inset-0 transition-opacity duration-300',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                    style={sectionStyle}
                  >
                    <div
                      className={cn(
                        'relative aspect-square w-full overflow-clip rounded-4xl border border-slate-100',
                        'bg-card',
                      )}
                    >
                      {img && (
                        <div className={cn('relative flex h-full w-full items-center justify-center')}>
                          <Image
                            src={img.src}
                            width={img.srcWidth}
                            height={img.srcHeight}
                            alt={intl.formatMessage(item.title)}
                            style={{ height: undefined }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Spacer to maintain aspect ratio */}
              <div className="aspect-square w-full opacity-0">
                <div className="h-full w-full" />
              </div>
            </div>
            {/* Mobile section content */}
            <FeatureSection
              section={section}
              sectionIndex={sectionIndex}
              onItemSelect={itemIndex => handleItemSelect(sectionIndex, itemIndex)}
              isActive={activeIndex === sectionIndex}
              onBecomeVisible={handleSectionVisible}
            />
          </div>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden py-40 lg:block lg:w-4/10">
        {featureSections.map((section, sectionIndex) => (
          <FeatureSection
            key={section.title.id}
            section={section}
            sectionIndex={sectionIndex}
            onItemSelect={itemIndex => handleItemSelect(sectionIndex, itemIndex)}
            isActive={activeIndex === sectionIndex}
            onBecomeVisible={handleSectionVisible}
          />
        ))}
      </div>

      {/* Desktop sticky features visuals */}
      <div className="relative hidden self-stretch lg:block lg:w-6/10">
        <div className="sticky top-[16vh] flex flex-col items-center justify-start pt-[74vh]">
          <div className="absolute inset-[0%] h-full">
            {featureSections.map((section, sectionIndex) => (
              <React.Fragment key={section.title.id}>
                {section.items.map((item, itemIndex) => {
                  const img = item.media || section.items[0]?.media;
                  const isActive = activeIndex === sectionIndex && activeSectionItems[sectionIndex] === itemIndex;

                  const sectionStyle = {
                    ...(section.fgColor && {
                      '--primary': `var(--color-${section.fgColor})`,
                    }),
                    ...(section.bgColor && {
                      '--card': `var(--color-${section.bgColor})`,
                    }),
                  } as React.CSSProperties;
                  return (
                    <div
                      key={`${section.title.id}-${item.title.id}`}
                      className="absolute inset-[0%] flex h-full items-center justify-center"
                      style={sectionStyle}
                    >
                      <div
                        className={cn(
                          'relative aspect-square w-full overflow-clip rounded-4xl border border-slate-100 transition-opacity',
                          'bg-card',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                      >
                        {img && (
                          <div className={cn('relative flex h-full w-full items-center justify-center')}>
                            <Image
                              src={img.src}
                              width={img.srcWidth}
                              height={img.srcHeight}
                              alt={intl.formatMessage(item.title)}
                              style={{ height: undefined }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
