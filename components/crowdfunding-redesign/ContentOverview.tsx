import React, { useEffect, useState } from 'react';
import { cva } from 'class-variance-authority';
// eslint-disable-next-line no-restricted-imports
import Link from 'next/link';
import { triggerPrototypeToast } from './helpers';

export const ContentOverview = ({ content }) => {
  const [headings, setHeadings] = useState<string[]>([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h3');
    const headingTexts = Array.from(headingElements).map(h3 => h3.textContent?.trim() || '');
    setHeadings(headingTexts);
  }, [content]);

  const linkClasses = cva('px-2 font-semibold block hover:text-primary text-sm border-l-[3px]', {
    variants: {
      active: {
        true: 'border-primary/70',
        false: 'border-transparent',
      },
    },
    defaultVariants: {
      active: false,
    },
  });

  return (
    <div className="space-y-4">
      {headings.map(heading => (
        <Link href="#" key={heading} className={linkClasses()} onClick={triggerPrototypeToast}>
          {heading}
        </Link>
      ))}
    </div>
  );
};
