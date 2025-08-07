import React, { useCallback, useRef, useState } from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

import { featureSections } from './features-data';
import FeatureSection from './FeatureSection';

export default function Features({}) {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track active sub-items for each section
  const [activeSectionItems, setActiveSectionItems] = useState<number[]>(
    featureSections.map(() => 0), // Initialize with index 0 for each section
  );

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
    <section className="relative flex gap-18 px-6 pb-24" ref={containerRef}>
      <div className="w-4/10 py-40">
        {featureSections.map((section, sectionIndex) => (
          <FeatureSection
            key={`${section.title}-${sectionIndex}`}
            section={section}
            sectionIndex={sectionIndex}
            onItemSelect={itemIndex => handleItemSelect(sectionIndex, itemIndex)}
            isActive={activeIndex === sectionIndex}
            onBecomeVisible={handleSectionVisible}
          />
        ))}
      </div>
      {/* sticky features visuals */}
      <div className="relative w-6/10 self-stretch">
        {/* Sticky container with proper height and centering */}
        <div className="sticky top-[16vh] flex flex-col items-center justify-start pt-[74vh]">
          {/* sticky features box */}
          <div className="absolute inset-[0%] h-full">
            {featureSections.map((section, sectionIndex) => (
              <React.Fragment key={`${section.title}-${sectionIndex}`}>
                {section.items.map((item, itemIndex) => {
                  const img = item.media || section.items[0]?.media;
                  const isActive = activeIndex === sectionIndex && activeSectionItems[sectionIndex] === itemIndex;
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
                    <div
                      key={`${item.title}-${itemIndex}`}
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
                            {img.src.startsWith('/') ? (
                              <Image
                                src={img.src}
                                width={img.srcWidth}
                                height={img.srcHeight}
                                alt={img.alt ?? item.title}
                                style={img.style}
                              />
                            ) : (
                              <img
                                src={img.src}
                                style={img.style}
                                width={img.srcWidth}
                                height={img.srcHeight}
                                alt={img.alt ?? item.title}
                              />
                            )}
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
      <div className="fixed top-6 right-6">{/* <SimpleFeaturesEditor onSave={handleSaveFeatures} /> */}</div>
    </section>
  );
}
